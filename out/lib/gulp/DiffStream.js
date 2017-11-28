'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _gulpFilter = require('gulp-filter');

var _gulpFilter2 = _interopRequireDefault(_gulpFilter);

var _combinedStream = require('combined-stream');

var _combinedStream2 = _interopRequireDefault(_combinedStream);

var _DiffResultStream = require('../diff/DiffResultStream');

var _DiffResultStream2 = _interopRequireDefault(_DiffResultStream);

var _DiffItemStream = require('../diff/DiffItemStream');

var _DiffItemStream2 = _interopRequireDefault(_DiffItemStream);

var _DiffFileStream = require('../diff/DiffFileStream');

var _DiffFileStream2 = _interopRequireDefault(_DiffFileStream);

var _DiffFile = require('../diff/DiffFile');

var _DiffFile2 = _interopRequireDefault(_DiffFile);

var _DiffItem = require('../diff/DiffItem');

var _DiffItem2 = _interopRequireDefault(_DiffItem);

var _UaNodeToAtviseFileTransformer = require('../../transform/UaNodeToAtviseFileTransformer');

var _UaNodeToAtviseFileTransformer2 = _interopRequireDefault(_UaNodeToAtviseFileTransformer);

var _FileToAtviseFileTransformer = require('../../transform/FileToAtviseFileTransformer');

var _FileToAtviseFileTransformer2 = _interopRequireDefault(_FileToAtviseFileTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that diff atvise server resources with file system resources.
 */
class DiffStream {

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
    const diffFilePath = options.filePath || 'diff.log';

    // diff file streams
    const fsFileStream = new _FileToAtviseFileTransformer2.default({
      nodesToTransform: nodesToDiff,
      applyTransformers: false
    }).pipe(new _DiffFileStream2.default({ fileType: _DiffFile2.default.FileType.FsFile }));

    const serverFileTransformer = new _UaNodeToAtviseFileTransformer2.default({ nodesToTransform: nodesToDiff });

    const serverFileStream = serverFileTransformer.stream.pipe(new _DiffFileStream2.default({ fileType: _DiffFile2.default.FileType.ServerFile }));

    // diff file processors
    const diffItemStream = new _DiffItemStream2.default();

    const diffResultStream = new _DiffResultStream2.default({ filePath: diffFilePath });
    const equalFilesFilter = (0, _gulpFilter2.default)(diffItem => diffItem.state.value !== _DiffItem2.default.DiffStates.Equal.value);
    const logger = diffResultStream.logger;

    const combinedStream = new _combinedStream2.default({ pauseStreams: false });

    logger.write('Modified:\n');

    combinedStream.append(fsFileStream);
    combinedStream.append(serverFileStream);

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Diffed: ${diffResultStream._processed} (${diffResultStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return combinedStream.pipe(diffItemStream).pipe(equalFilesFilter).pipe(diffResultStream).once('finish', () => {
      const itemsCache = Object.values(diffItemStream.itemsCache);
      const states = _DiffItem2.default.DiffStates;
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
exports.default = DiffStream;
//# sourceMappingURL=DiffStream.js.map