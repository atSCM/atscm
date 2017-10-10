import PushStream from '../lib/gulp/PushStream';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {

  return new PushStream({
    nodesToPush: ProjectConfig.nodes,
    createNodes: true
  });
}

push.description = 'Push all stored nodes to atvise server';
