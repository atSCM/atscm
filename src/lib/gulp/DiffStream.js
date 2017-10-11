import readline from 'readline';
import Logger from 'gulplog';
import { src } from 'gulp';
import DiffResultStream from '../diff/DiffResultStream';
import DiffItemStream from '../diff/DiffItemStream';
import DiffFileStream from '../diff/DiffFileStream';
import DiffFile from '../diff/DiffFile';
import CombinedStream from 'combined-stream';
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
    const fsFileStream = new FileToAtviseFileTransformer({nodesToTransform: nodesToDiff})
      .pipe(new DiffFileStream({fileType: DiffFile.FileType.FsFile}));

    const serverFileTransformer = new UaNodeToAtviseFileTransformer({nodesToTransform: nodesToDiff});

    const serverFileStream = serverFileTransformer.stream
      .pipe(new DiffFileStream({fileType: DiffFile.FileType.ServerFile}));

    // diff file processors
    const diffItemStream = new DiffItemStream();
    const diffResultStream = new DiffResultStream({filePath: filePath});

    const combinedStream = new CombinedStream({pauseStreams: false});

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
      .pipe(diffResultStream)
      .once('finish', () => {
        const itemsCache = diffItemStream.itemsCache;

        if (Object.keys(itemsCache).lenght > 0) {
          diffResultStream.once('drained', () => {
            clearInterval(printProgress);
          });

          Object.values(diffItemStream.itemsCache)
            .forEach(file => diffResultStream.write(file));
        } else {
         clearInterval(printProgress);
        }
      });
  }
}
