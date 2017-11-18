import readline from 'readline';
import Logger from 'gulplog';
import filter from 'gulp-filter';
import CombinedStream from 'combined-stream';
import DiffResultStream from '../diff/DiffResultStream';
import DiffItemStream from '../diff/DiffItemStream';
import DiffFileStream from '../diff/DiffFileStream';
import DiffFile from '../diff/DiffFile';
import DiffItem from '../diff/DiffItem';
import UaNodeToAtviseFileTransformer from '../../transform/UaNodeToAtviseFileTransformer';
import FileToAtviseFileTransformer from '../../transform/FileToAtviseFileTransformer';

/**
 * A stream that diff atvise server resources with file system resources.
 */
export default class DiffStream {

  /**
   * Creates a new DiffStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {NodeId[]} [options.nodesToDiff] The nodes to diff.
   * @param {String|Path|Buffer} [options.filePath] The diff files path.
   */
  constructor(options = {}) {
    /**
     * The nodes to diff
     * @type {NodeId[]}
     */
    const nodesToDiff = options.nodesToDiff || [];

    /**
     * The diff file path
     * @type {String|Path|Buffer}
     */
    const filePath = options.filePath || 'diff.log';

    // diff file streams
    const fsFileStream = new FileToAtviseFileTransformer({ nodesToTransform: nodesToDiff })
      .pipe(new DiffFileStream({ fileType: DiffFile.FileType.FsFile }));

    const serverFileTransformer = new UaNodeToAtviseFileTransformer({
      nodesToTransform: nodesToDiff,
    });

    const serverFileStream = serverFileTransformer.stream
      .pipe(new DiffFileStream({ fileType: DiffFile.FileType.ServerFile }));

    // diff file processors
    const diffItemStream = new DiffItemStream();
    const diffResultStream = new DiffResultStream({ filePath });
    const equalFilesFilter = filter(({ state }) => state.value !== DiffItem.DiffStates.Equal.value);
    const logger = diffResultStream.logger;

    const combinedStream = new CombinedStream({ pauseStreams: false });

    logger.write('Modified:\n');

    combinedStream.append(fsFileStream);
    combinedStream.append(serverFileStream);

    const printProgress = setInterval(() => {
      Logger.info(
        `Diffed: ${diffResultStream._processed} (${diffResultStream.opsPerSecond.toFixed(1)} ops/s)`
      );

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);


    return combinedStream
      .pipe(diffItemStream)
      .pipe(equalFilesFilter)
      .pipe(diffResultStream)
      .once('finish', () => {
        const itemsCache = Object.values(diffItemStream.itemsCache);
        const states = DiffItem.DiffStates;
        const addedItems = [];
        const deletedItems = [];

        if (itemsCache.length > 0) {
          diffResultStream.once('drained', () => {
            clearInterval(printProgress);
          });

          itemsCache.forEach(diffItem => {
            if (diffItem.state.value === states.Added.value) {
              addedItems.push(diffItem);
            } else if (diffItem.state.value === states.Deleted.value) {
              deletedItems.push(diffItem);
            }
          });

          logger.write('\nAdded:\n');
          addedItems.forEach(file => diffResultStream.write(file));

          logger.write('\nDeleted:\n');
          deletedItems.forEach(file => diffResultStream.write(file));
        } else {
          clearInterval(printProgress);
        }
      });
  }
}
