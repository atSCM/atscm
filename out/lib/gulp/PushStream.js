'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _WriteStream = require('../server/WriteStream');

var _WriteStream2 = _interopRequireDefault(_WriteStream);

var _CreateNodeStream = require('../server/CreateNodeStream');

var _CreateNodeStream2 = _interopRequireDefault(_CreateNodeStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that transforms read {@link vinyl~File}s and pushes them to atvise server.
 */
class PushStream {

  /**
   * Creates a new PushSteam based on a source file stream.
   * @param {Stream} srcStream The file stream to read from.
   */
  constructor(srcStream) {
    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromFilesystem });
    const createStream = new _CreateNodeStream2.default();
    const writeStream = new _WriteStream2.default(createStream);

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Pushed: ${writeStream._processed} (${writeStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    return _Transformer2.default.applyTransformers(srcStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromFilesystem).pipe(writeStream).pipe(createStream).on('finish', () => {
      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.clearLine(process.stdout);
      }

      clearInterval(printProgress);
    });
  }

}
exports.default = PushStream;
//# sourceMappingURL=PushStream.js.map