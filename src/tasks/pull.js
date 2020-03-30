import parseOptions from 'mri';
import { emptyDir } from 'fs-extra';
import Logger from 'gulplog';
import NodeBrowser from '../lib/server/NodeBrowser';
import ProjectConfig from '../config/ProjectConfig';
import Transformer, { TransformDirection } from '../lib/transform/Transformer.js';
import dest from '../lib/gulp/dest';
import { reportProgress } from '../lib/helpers/log';
import { handleTaskError, finishTask } from '../lib/helpers/tasks';
import Session from '../lib/server/Session';

/**
 * Pulls the given nodes from the server.
 * @param {NodeId[]} nodes The nodes to pull from the server.
 * @param {Object} options Options passed to {@link NodeBrowser}.
 */
export function performPull(nodes, options = {}) {
  const writeStream = dest('./src', { cleanRenameConfig: options.clean });
  const applyTransforms = Transformer.combinedTransformer(
    ProjectConfig.useTransformers,
    TransformDirection.FromDB
  );

  const browser = new NodeBrowser({
    ...options,
    async handleNode(node, { transform = true } = {}) {
      let removed = false;
      const context = {
        _added: [],
        addNode(n) {
          this._added.push(n);
        },
        remove: () => {
          removed = true;
        },
      };

      if (transform) {
        await applyTransforms(node, context);
      }

      if (removed) {
        return;
      }
      await writeStream.writeAsync(node);

      // Enqueue added nodes
      if (context._added.length) {
        context._added.forEach(n => this.addNode(n));
      }
    },
  });

  return Object.assign(browser.browse(nodes).then(() => writeStream.writeRenamefile()), {
    browser,
  });
}

/**
 * Pulls all nodes from atvise server.
 * @param {Object} [options] The options to use.
 * @param {boolean} [options.clean] If the source directory should be cleaned first.
 */
export default function pull(options) {
  const { clean } = typeof options === 'object' ? options : parseOptions(process.argv.slice(2));

  Session.pool();

  return Promise.resolve()
    .then(async () => {
      if (clean) {
        Logger.info('Using --clean, removing pulled files first');
        await emptyDir('./src');
      }
    })
    .then(() => {
      const promise = performPull(ProjectConfig.nodes, { clean });

      return reportProgress(promise, {
        getter: () => promise.browser._pushed,
        formatter: count => `Processed ${count} nodes`,
      });
    })
    .then(finishTask, handleTaskError);
}
