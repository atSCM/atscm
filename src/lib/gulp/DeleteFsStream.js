import readline from 'readline';
import Logger from 'gulplog';
import { join } from 'path';
import { remove, existsSync, createReadStream } from 'fs-extra';
import ProjectConfig from '../../config/ProjectConfig';

/**
 * A stream that deletes listed nodes on the filesystem
 */
export default class DeleteFsStream {

  /**
   * Creates a new DeleteFsStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {String} [options.deleteFileName] The delete file name.
   */
  constructor(options = {}) {
    /**
     * The delete file name
     * @type {String}
     */
    const deleteFileName = options.deleteFileName || 'deleteFs.txt';

    let processed = 0;
    const base = join(process.cwd(), ProjectConfig.RelativeSourceDirectoryPath);

    const lineReader = readline.createInterface({
      input: createReadStream(deleteFileName),
    });

    const printProgress = setInterval(() => {
      Logger.info(`Deleted: ${processed}`);

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    lineReader.on('line', line => {
      const trimmedLine = line.trim();
      const lineArray = trimmedLine.split('nodeFilePath=');
      let filePath = '';

      if (lineArray.length > 1) {
        filePath = lineArray[1];

        if (filePath.indexOf(', nodeId=') > -1) {
          filePath = filePath.split(', nodeId=')[0];
        }
      } else {
        filePath = trimmedLine;
      }

      processed++;

      if (filePath) {
        const path = join(base, filePath);

        if (existsSync(path)) {
          remove(path)
            .catch(err => Logger.error(`Error removing file: '${path}', message: ${err.message}`));
        }
      }
    });

    lineReader.on('close', () => {
      clearInterval(printProgress);
    });

    return lineReader;
  }
}
