"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _readline = _interopRequireDefault(require("readline"));

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _Transformer = _interopRequireWildcard(require("../transform/Transformer"));

var _WriteStream = _interopRequireDefault(require("../server/WriteStream"));

var _CreateNodeStream = _interopRequireDefault(require("../server/CreateNodeStream"));

var _AddReferencesStream = _interopRequireDefault(require("../server/AddReferencesStream"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

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
    const createStream = new _CreateNodeStream.default();
    const addReferencesStream = new _AddReferencesStream.default();
    const writeStream = new _WriteStream.default(createStream, addReferencesStream);
    const printProgress = setInterval(() => {
      _gulplog.default.info(`Pushed: ${writeStream._processed} (${writeStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog.default.listenerCount('info') > 0) {
        _readline.default.cursorTo(process.stdout, 0);

        _readline.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);
    return _Transformer.default.applyTransformers(srcStream, _ProjectConfig.default.useTransformers, _Transformer.TransformDirection.FromFilesystem).pipe(writeStream).pipe(createStream).pipe(addReferencesStream).on('finish', () => {
      if (_gulplog.default.listenerCount('info') > 0) {
        _readline.default.cursorTo(process.stdout, 0);

        _readline.default.clearLine(process.stdout);
      }

      clearInterval(printProgress);
    });
  }

}

exports.default = PushStream;
//# sourceMappingURL=PushStream.js.map