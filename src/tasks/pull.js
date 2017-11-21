import ProjectConfig from '../config/ProjectConfig';
import PullStream from '../lib/gulp/PullStream';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  return new PullStream({
    nodesToPull: ProjectConfig.nodes,
  });
}

pull.description = 'Pull all nodes from atvise server';
