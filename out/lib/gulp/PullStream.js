'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulp = require('gulp');

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
class PullStream {

  /**
   * Creates a new PullStream based on a stream that writes {@link ReadStream.ReadResult} which may
   * be an instance of {@link ReadStream}.
   * @param {Stream} readStream The stream to read from.
   */
  constructor(readStream) {
    let pulled = 0;

    readStream.on('data', () => pulled++);
    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromDB });

    const printProgress = setInterval(() => {
      process.stdout.write(`\rPulled: ${pulled}`);
    }, 1000);

    return _Transformer2.default.applyTransformers(readStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromDB).pipe((0, _gulp.dest)('./src')).on('data', () => {}) // Unpipe readable stream
    .on('end', () => {
      process.stdout.clearLine();
      process.stdout.write('\r');
      clearInterval(printProgress);
    });
  }

}
exports.default = PullStream;