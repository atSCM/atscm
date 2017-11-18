import readline from 'readline';
import Logger from 'gulplog';
import { src } from 'gulp';
import { join, dirname } from 'path';
import { remove, existsSync, createReadStream, readdirSync } from 'fs-extra';
import CombinedStream from 'combined-stream';
import UaNodeToAtviseFileTransformer from '../../transform/UaNodeToAtviseFileTransformer';
import FileToAtviseFileTransformer from '../../transform/FileToAtviseFileTransformer';
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

    const processed = 0;
    const config = ProjectConfig.RelativeSourceDirectoryPath;
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
      const filePath = line.indexOf('nodeFilePath=') > -1 ? line.split('nodeFilePath=')[1].split(', nodeId=')[0].trim() :
        line.trim();

      const path = join(base, filePath);

      if (existsSync(path)) {
        remove(path)
          .catch(err => Logger.error(`Error removing file: '${path}', message: ${err.message}`));
      } else {
        Logger.error(`File '${path}' does not exist`);
      }
    });

    lineReader.on('close', () => {
      clearInterval(printProgress);
    });

    return lineReader;
  }
}
