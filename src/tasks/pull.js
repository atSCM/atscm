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

export function performPull(nodes, options = {}) {
  const writeStream = dest('./src');
  const applyTransforms = Transformer.combinedTransformer(
    ProjectConfig.useTransformers, TransformDirection.FromDB);

  const browser = new NodeBrowser({
    ...options,
    async handleNode(node, { transform = true } = {}) {
      const context = {
        _added: [],
        addNode(n) {
          this._added.push(n);
        },
      };

      if (transform) {
        await applyTransforms(node, context);
      }

      await writeStream.writeAsync(node);

      // Enqueue added nodes
      if (context._added.length) {
        context._added.forEach(n => this.addNode(n));
      }
    },
  });

  return Object.assign(
    browser.browse(nodes)
      .then(() => writeStream.writeRenamefile())
    , { browser });
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
    .then(() => {
      if (clean) {
        Logger.info('Using --clean, removing pulled files first');
        return emptyDir('./src');
      }

      return Promise.resolve();
    })
    .then(() => {
      const promise = performPull(ProjectConfig.nodes);

      return reportProgress(promise, {
        getter: () => promise.browser._pushed,
        formatter: count => `Processed ${count} nodes`,
      });
    })
    .then(finishTask, handleTaskError);
}

pull.description = 'Pull all nodes from atvise server';
