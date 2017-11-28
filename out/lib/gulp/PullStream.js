'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulp = require('gulp');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _UaNodeToAtviseFileTransformer = require('../../transform/UaNodeToAtviseFileTransformer');

var _UaNodeToAtviseFileTransformer2 = _interopRequireDefault(_UaNodeToAtviseFileTransformer);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
class PullStream {

  /**
   * Creates a new PullStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {NodeId[]} [options.nodesToPull] The nodes to push.
   * @param {Boolean} [options.useInputStream] Defines if the given input
   * stream should be used for mapping.
   * @param {Stream} [options.inputStream] The input stream to use.
   */
  constructor(options = {}) {
    /**
     * The nodes to pull
     * @type {NodeId[]}
     */
    const nodesToPull = options.nodesToPull || [];

    const fileTransformer = new _UaNodeToAtviseFileTransformer2.default({
      nodesToTransform: nodesToPull,
      useInputStream: options.useInputStream,
      inputStream: options.inputStream
    });

    const readStream = fileTransformer.readStream;

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Pulled: ${readStream.processed} (${readStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return fileTransformer.stream.pipe((0, _gulp.dest)(_ProjectConfig2.default.RelativeSourceDirectoryPath)).on('finish', () => {
      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.clearLine(process.stdout, 0);
        _readline2.default.cursorTo(process.stdout, 0);
      }

      clearInterval(printProgress);
    });
  }
}
exports.default = PullStream;
//# sourceMappingURL=PullStream.js.map