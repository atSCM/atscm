import ProjectConfig from '../config/ProjectConfig';
import NodeStream from '../lib/server/NodeStream';
import ReadStream from '../lib/server/ReadStream';
import PullStream from '../lib/gulp/PullStream';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  return new PullStream(
    (new NodeStream(ProjectConfig.nodes))
      .pipe(new ReadStream())
  );
}

pull.description = 'Pull all nodes from atvise server';
