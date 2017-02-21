import { dest } from 'gulp';
import ProjectConfig from '../config/ProjectConfig';
import NodeStream from '../lib/server/NodeStream';
import ReadStream from '../lib/server/ReadStream';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from '../transform/Mapping';

/**
 * Pulls all nodes from atvise server.
 */
export default function pull() {
  let found = 0;
  let pulled = 0;
  let stored = 0;
  const nodeStream = new NodeStream(ProjectConfig.nodes, { read: true })
    .on('data', () => found++);
  const readStream = new ReadStream()
    .on('data', () => pulled++);
  const mappingStream = new MappingTransformer({ direction: TransformDirection.FromDB });
  const storeStream = dest('./src')
    .on('data', () => stored++);

  const printProgress = setInterval(() => {
    process.stdout.write(`\rFound: ${found}, pulled: ${pulled}, stored: ${stored}`);
  }, 1000);

  return nodeStream
    .pipe(readStream)
    .pipe(mappingStream)
    .pipe(storeStream)
    .on('end', () => {
      process.stdout.clearLine();
      process.stdout.write('\r');
      clearInterval(printProgress);
    });
}

pull.description = 'Pull all nodes from atvise server';
