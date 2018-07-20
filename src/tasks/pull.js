import ProjectConfig from '../config/ProjectConfig';
import NodeStream from '../lib/server/NodeStream';
import PullStream from '../lib/gulp/PullStream';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  return new PullStream(
    (new NodeStream(ProjectConfig.nodes))
  );
}

pull.description = 'Pull all nodes from atvise server';
