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

  const nodeStream = new NodeStream(ProjectConfig.nodes)
    .on('data', () => found++);
  const readStream = new ReadStream()
    .on('data', () => pulled++);
  const mappingStream = new MappingTransformer({ direction: TransformDirection.FromDB });

  const printProgress = setInterval(() => {
    process.stdout.write(`\rFound: ${found}, pulled: ${pulled}`);
  }, 1000);

  return Transformer.applyTransformers(
    nodeStream
      .pipe(readStream)
      .pipe(mappingStream),
    ProjectConfig.useTransformers,
    TransformDirection.FromDB
  )
    .pipe(dest('./src'))
    .on('data', () => {}) // Unpipe readable stream
    .on('end', () => {
      process.stdout.clearLine();
      process.stdout.write('\r');
      clearInterval(printProgress);
    });
}

pull.description = 'Pull all nodes from atvise server';
