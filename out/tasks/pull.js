"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pull;

var _mri = _interopRequireDefault(require("mri"));

var _fsExtra = require("fs-extra");

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig"));

var _NodeStream = _interopRequireDefault(require("../lib/server/NodeStream"));

var _PullStream = _interopRequireDefault(require("../lib/gulp/PullStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pulls all nodes from atvise server.
 * @param {Object} [options] The options to use.
 */
function pull(options) {
  const {
    clean
  } = options || (0, _mri.default)(process.argv.slice(2));
  return Promise.resolve().then(() => {
    if (clean) {
      _gulplog.default.info('Using --clean, removing pulled files first');

      return (0, _fsExtra.emptyDir)('./src');
    }

    return Promise.resolve();
  }).then(() => (0, _streamToPromise.default)(new _PullStream.default(new _NodeStream.default(_ProjectConfig.default.nodes))));
}

pull.description = 'Pull all nodes from atvise server';
//# sourceMappingURL=pull.js.map