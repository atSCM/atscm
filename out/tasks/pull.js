'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pull;

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _NodeStream = require('../lib/server/NodeStream');

var _NodeStream2 = _interopRequireDefault(_NodeStream);

var _ReadStream = require('../lib/server/ReadStream');

var _ReadStream2 = _interopRequireDefault(_ReadStream);

var _PullStream = require('../lib/gulp/PullStream');

var _PullStream2 = _interopRequireDefault(_PullStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pulls all nodes from atvise server.
 */
function pull() {
  return new _PullStream2.default(new _NodeStream2.default(_ProjectConfig2.default.nodes).pipe(new _ReadStream2.default()));
}

pull.description = 'Pull all nodes from atvise server';
//# sourceMappingURL=pull.js.map