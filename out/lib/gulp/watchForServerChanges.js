'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = watchForServerChanges;

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Watcher = require('../server/Watcher');

var _Watcher2 = _interopRequireDefault(_Watcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a fully set up gulp task that watches atvise server nodes for value changes.
 * @param {function(path: String, root: String, stat: Object)} listener Called when a node changes.
 * @return {function()} The resulting gulp task.
 */
function watchForServerChanges(listener) {
  return cb => new _Watcher2.default().on('change', data => listener(data)).on('ready', () => _gulplog2.default.info('Waiting for server changes...')).on('error', () => {}).once('error', err => cb(err));
}