import readline from 'readline';
import { dest } from 'gulp';
import Logger from 'gulplog';
import UaNodeToAtviseFileTransformer from '../../transform/UaNodeToAtviseFileTransformer';
import ProjectConfig from '../../config/ProjectConfig';

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
export default class PullStream {

  /**
   * Creates a new PullStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {NodeId[]} [options.nodesToPull] The nodes to push.
   * @param {boolean} [options.useInputStream] Defines if the given input
   * stream should be used for mapping.
   * @param {Stream} [options.inputStream] The input stream to use.
   */
  constructor(options = {}) {
    /**
     * The nodes to pull
     * @type {NodeId[]}
     */
    const nodesToPull = options.nodesToPull || [];

    const fileTransformer = new UaNodeToAtviseFileTransformer({
      nodesToTransform: nodesToPull,
      useInputStream: options.useInputStream,
      inputStream: options.inputStream,
    });

    const readStream = fileTransformer.readStream;

    const printProgress = setInterval(() => {
      Logger.info(`Pulled: ${readStream.processed} (${readStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return fileTransformer.stream
      .pipe(dest(ProjectConfig.RelativeSourceDirectoryPath))
      .on('finish', () => {
        if (Logger.listenerCount('info') > 0) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }

        clearInterval(printProgress);
      });
  }

}
