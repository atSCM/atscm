'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulp = require('gulp');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _Newlines = require('../../transform/Newlines');

var _Newlines2 = _interopRequireDefault(_Newlines);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
class PullStream {

  /**
   * Creates a new PullStream based on a stream that writes {@link ReadStream.ReadResult} which may
   * be an instance of {@link ReadStream}.
   * @param {ReadStream} readStream The stream to read from.
   */
  constructor(readStream) {
    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromDB });

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Pulled: ${readStream.processed} (${readStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return _Transformer2.default.applyTransformers(readStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers.concat(new _Newlines2.default()), _Transformer.TransformDirection.FromDB).pipe((0, _gulp.dest)('./src')).on('finish', () => {
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