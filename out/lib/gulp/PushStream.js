'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _WriteStream = require('../server/WriteStream');

var _WriteStream2 = _interopRequireDefault(_WriteStream);

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
    let uploaded = 0;

    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromFilesystem });
    const writeStream = new _WriteStream2.default().on('data', () => uploaded++);

    const printProgress = setInterval(() => {
      process.stdout.write(`\rUploaded: ${uploaded}`);
    }, 1000);

    return _Transformer2.default.applyTransformers(srcStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromFilesystem).pipe(writeStream).on('end', () => {
      process.stdout.clearLine();
      process.stdout.write('\r');
      clearInterval(printProgress);
    });
  }

}
exports.default = PushStream;