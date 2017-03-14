import readline from 'readline';
import { dest } from 'gulp';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import Transformer, { TransformDirection } from '../transform/Transformer';
import MappingTransformer from '../../transform/Mapping';

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
export default class PullStream {

  /**
   * Creates a new PullStream based on a stream that writes {@link ReadStream.ReadResult} which may
   * be an instance of {@link ReadStream}.
   * @param {Stream} readStream The stream to read from.
   */
  constructor(readStream) {
    let pulled = 0;

    readStream
      .on('data', () => pulled++);
    const mappingStream = new MappingTransformer({ direction: TransformDirection.FromDB });

    const printProgress = setInterval(() => {
      Logger.info(`Pulled: ${pulled}`);

      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, -1);
    }, 1000);

    return Transformer.applyTransformers(
      readStream
        .pipe(mappingStream),
      ProjectConfig.useTransformers,
      TransformDirection.FromDB
    )
      .pipe(dest('./src'))
      .on('data', () => {}) // Unpipe readable stream
      .on('end', () => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);

        clearInterval(printProgress);
      });
  }

}
