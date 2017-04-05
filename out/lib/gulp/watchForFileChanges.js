'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = watchForFileChanges;

var _sane = require('sane');

var _sane2 = _interopRequireDefault(_sane);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a fully set up gulp task that watches the project's source files for changes.
 * @param {function(path: String, root: String, stat: Object)} listener Called when a file changes.
 * @return {function()} The resulting gulp task.
 */
function watchForFileChanges(listener) {
  return cb => (0, _sane2.default)('./src', {
    glob: '**/*.*',
    watchman: ['darwin'].indexOf(process.platform) >= 0
  }).on('change', listener)
  // FIXME: Need to handle `add` and `delete` events
  .on('ready', () => _gulplog2.default.info('Waiting for file changes...')).on('error', err => cb(err));
}