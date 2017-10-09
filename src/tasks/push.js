import { src } from 'gulp';
import PushStream from '../lib/gulp/PushStream';

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {
  const combinedSrcStream = CombinedStream.create();

  ProjectConfig.nodes.map(nodeId => combinedSrcStream.append(src(`./src/${nodeId.filePath}/**/*.*`)));

  return new PushStream(combinedSrcStream, {createNodes: true});
}

push.description = 'Push all stored nodes to atvise server';
