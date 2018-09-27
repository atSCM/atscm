"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _src = _interopRequireDefault(require("../lib/gulp/src"));

var _PushStream = _interopRequireDefault(require("../lib/gulp/PushStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  return new _PushStream.default((0, _src.default)('./src/')); // FIXME: Get from config file
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map