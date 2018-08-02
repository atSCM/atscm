'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _src = require('../lib/gulp/src');

var _src2 = _interopRequireDefault(_src);

var _PushStream = require('../lib/gulp/PushStream');

var _PushStream2 = _interopRequireDefault(_PushStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  return new _PushStream2.default((0, _src2.default)('./src/')); // FIXME: Get from config file
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map