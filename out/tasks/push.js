'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _PushStream = require('../lib/gulp/PushStream');

var _PushStream2 = _interopRequireDefault(_PushStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  return new _PushStream2.default({
    nodesToPush: _ProjectConfig2.default.nodes,
    createNodes: true
  });
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map