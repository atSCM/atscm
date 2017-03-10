'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _gulp = require('gulp');

var _PushStream = require('../lib/gulp/PushStream');

var _PushStream2 = _interopRequireDefault(_PushStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  return new _PushStream2.default((0, _gulp.src)('./src/**/**/*.*', { buffer: false }));
}

push.description = 'Push all stored nodes to atvise server';