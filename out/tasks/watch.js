'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _gulp = require('gulp');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _through = require('through2');

var _watchForFileChanges = require('../lib/gulp/watchForFileChanges');

var _watchForFileChanges2 = _interopRequireDefault(_watchForFileChanges);

var _watchForServerChanges = require('../lib/gulp/watchForServerChanges');

var _watchForServerChanges2 = _interopRequireDefault(_watchForServerChanges);

var _PushStream = require('../lib/gulp/PushStream');

var _PushStream2 = _interopRequireDefault(_PushStream);

var _PullStream = require('../lib/gulp/PullStream');

var _PullStream2 = _interopRequireDefault(_PullStream);

var _AtviseFile = require('../lib/server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let pulling = false;
let pushing = false;
let lastPull = 0;
let lastPushed = null;

/**
 * Watches local files and atvise server nodes to trigger pull/push on change.
 */
const watch = (0, _gulp.parallel)((0, _watchForFileChanges2.default)((path, root, stat) => {
  if (!pulling && _AtviseFile2.default.normalizeMtime(stat.mtime) > lastPull) {
    pushing = true;
    _gulplog2.default.info(path, 'changed');

    const source = (0, _gulp.src)((0, _path.join)(root, path), { base: root });

    new _PushStream2.default(source).on('data', file => lastPushed = file.nodeId.toString()).on('end', () => {
      pushing = false;
    });
  }
}), (0, _watchForServerChanges2.default)(readResult => {
  if (!pushing) {
    if (readResult.nodeId.toString() !== lastPushed) {
      pulling = true;
      _gulplog2.default.info(readResult.nodeId.toString(), 'changed');

      const readStream = (0, _through.obj)();
      readStream.write(readResult);
      readStream.end();

      new _PullStream2.default(readStream).on('end', () => {
        pulling = false;
        lastPull = _AtviseFile2.default.normalizeMtime(readResult.mtime);
      });
    } else {
      lastPushed = null;
    }
  }
}));

exports.default = watch;


watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';