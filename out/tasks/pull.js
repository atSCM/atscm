"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pull;

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig"));

var _NodeStream = _interopRequireDefault(require("../lib/server/NodeStream"));

var _PullStream = _interopRequireDefault(require("../lib/gulp/PullStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pulls all nodes from atvise server.
 */
function pull() {
  return new _PullStream.default(new _NodeStream.default(_ProjectConfig.default.nodes));
}

pull.description = 'Pull all nodes from atvise server';
//# sourceMappingURL=pull.js.map