import { src } from 'gulp';
import PushStream from '../lib/gulp/PushStream';
import CombinedStream from 'combined-stream';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push(callback) {
  const combinedSrcStream = CombinedStream.create();

  ProjectConfig.nodes.map(nodeId => combinedSrcStream.append(src(`./src/${nodeId.filePath}/**/*.*`)));

  const pushStream = new PushStream(combinedSrcStream, {createNodes: true});

  // workaround because process does not finish after task completion
  pushStream.on("pushStreamFinished", () => {
    callback();
    process.exit();
  });

  return pushStream;
}

push.description = 'Push all stored nodes to atvise server';