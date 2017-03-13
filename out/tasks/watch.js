'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = watch;

var _path = require('path');

var _gulp = require('gulp');

var _browserSync = require('browser-sync');

var _browserSync2 = _interopRequireDefault(_browserSync);

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

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Watches local files and atvise server nodes to trigger pull/push on change.
 */
function watch() {
  let fileWatcher;
  let serverWatcher;
  const browserSyncInstance = _browserSync2.default.create();

  let pulling = false;
  let pushing = false;
  let lastPull = 0;
  let lastPushed = null;

  function initBrowserSync() {
    return new Promise(resolve => {
      let ready = 0;

      function initIfReady() {
        ready++;

        if (ready === 2) {
          browserSyncInstance.init({
            proxy: {
              target: `${_ProjectConfig2.default.host}:${_ProjectConfig2.default.port.http}`,
              ws: true
            }
          }, () => resolve());
        }
      }

      fileWatcher.once('ready', () => initIfReady());
      serverWatcher.once('ready', () => initIfReady());
    });
  }

  function rejectOnError(err, resolve, reject) {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  }

  function startFileWatcher() {
    return new Promise((resolve, reject) => {
      fileWatcher = (0, _watchForFileChanges2.default)((path, root, stat) => {
        if (!pulling && _AtviseFile2.default.normalizeMtime(stat.mtime) > lastPull) {
          pushing = true;
          _gulplog2.default.info(path, 'changed');

          const source = (0, _gulp.src)((0, _path.join)(root, path), { base: root });

          new _PushStream2.default(source).on('data', file => lastPushed = file.nodeId.toString()).on('end', () => {
            pushing = false;
            browserSyncInstance.reload();
            fileWatcher.emit('push');
          });
        }
      })(err => rejectOnError(err, resolve, reject));
    });
  }

  function startServerWatcher() {
    return new Promise((resolve, reject) => {
      serverWatcher = (0, _watchForServerChanges2.default)(readResult => {
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
              browserSyncInstance.reload();
              fileWatcher.emit('pull');
            });
          } else {
            lastPushed = null;
          }
        }
      })(err => rejectOnError(err, resolve, reject));
    });
  }

  const promise = Promise.all([startFileWatcher(), startServerWatcher()]);

  initBrowserSync();

  promise.browserSync = browserSyncInstance;
  promise.fileWatcher = fileWatcher;
  promise.serverWatcher = serverWatcher;

  return promise;
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';