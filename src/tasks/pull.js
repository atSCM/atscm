import ProjectConfig from '../config/ProjectConfig';
import BrowseStream from '../lib/server/BrowseStream';
import ReadStream from '../lib/server/ReadStream';
import PullStream from '../lib/gulp/PullStream';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  return new PullStream(
    (new BrowseStream(ProjectConfig.nodes))
     .pipe(new ReadStream())
  );
}

pull.description = 'Pull all nodes from atvise server';
