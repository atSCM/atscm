"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _readline = _interopRequireDefault(require("readline"));

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _Transformer = _interopRequireWildcard(require("../transform/Transformer"));

var _dest = _interopRequireDefault(require("./dest"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
    const printProgress = setInterval(() => {
      _gulplog.default.info(`Pulled: ${readStream.processed} (${readStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog.default.listenerCount('info') > 0) {
        _readline.default.cursorTo(process.stdout, 0);

        _readline.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);
    return _Transformer.default.applyTransformers(readStream, _ProjectConfig.default.useTransformers, _Transformer.TransformDirection.FromDB).pipe((0, _dest.default)('./src')) // FIXME: Get from config file
    .on('finish', () => {
      if (_gulplog.default.listenerCount('info') > 0) {
        _readline.default.clearLine(process.stdout, 0);

        _readline.default.cursorTo(process.stdout, 0);
      }

      clearInterval(printProgress);
    });
  }

}

exports.default = PullStream;
//# sourceMappingURL=PullStream.js.map