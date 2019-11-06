import readline from 'readline';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import Transformer, { TransformDirection } from '../transform/Transformer';
import dest from './dest';

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
export default class PullStream {
  /**
   * Creates a new PullStream based on a stream that writes {@link ReadStream.ReadResult} which may
   * be an instance of {@link ReadStream}.
   * @param {ReadStream} readStream The stream to read from.
   */
  constructor(readStream) {
    const printProgress = setInterval(() => {
      Logger.info(`Pulled: ${readStream.processed} (${readStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return Transformer.applyTransformers(
      readStream,
      ProjectConfig.useTransformers,
      TransformDirection.FromDB
    )
      .pipe(dest('./src')) // FIXME: Get from config file
      .on('finish', () => {
        if (Logger.listenerCount('info') > 0) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }

        clearInterval(printProgress);
      });
  }
}
