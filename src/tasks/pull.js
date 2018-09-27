import parseOptions from 'mri';
import { emptyDir } from 'fs-extra';
import toPromise from 'stream-to-promise';
import Logger from 'gulplog';
import ProjectConfig from '../config/ProjectConfig';
import NodeStream from '../lib/server/NodeStream';
import PullStream from '../lib/gulp/PullStream';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  const { clean } = parseOptions(process.argv.slice(2));

  return Promise.resolve()
    .then(() => {
      if (clean) {
        Logger.info('Using --clean, removing pulled files first');
        return emptyDir('./src');
      }

      return Promise.resolve();
    })
    .then(() => toPromise(new PullStream(
      (new NodeStream(ProjectConfig.nodes))
    )));
}

pull.description = 'Pull all nodes from atvise server';
