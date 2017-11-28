'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WatchTask = undefined;
exports.default = watch;

var _path = require('path');

var _sane = require('sane');

var _sane2 = _interopRequireDefault(_sane);

var _browserSync = require('browser-sync');

var _browserSync2 = _interopRequireDefault(_browserSync);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _through = require('through2');

var _PushStream = require('../lib/gulp/PushStream');

var _PushStream2 = _interopRequireDefault(_PushStream);

var _PullStream = require('../lib/gulp/PullStream');

var _PullStream2 = _interopRequireDefault(_PullStream);

var _AtviseFile = require('../lib/mapping/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

var _Watcher = require('../lib/watch/Watcher');

var _Watcher2 = _interopRequireDefault(_Watcher);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _NodeId = require('../lib/ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _fs = require('../util/fs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The task executed when running `atscm watch`.
 */
class WatchTask {

  /**
   * Creates a new watch task instance. Also creates a new Browsersync instance.
   */
  constructor() {
    /**
     * The Browsersync instance used.
     * @type {events~Emitter}
     */
    this.browserSyncInstance = _browserSync2.default.create();

    /**
     * If the task is currently pulling.
     * @type {boolean}
     */
    this._pulling = false;

    /**
     * If the task is currently pushing.
     * @type {boolean}
     */
    this._pushing = false;

    /**
     * Timestamp of the last pull
     * @type {number}
     */
    this._lastPull = 0;

    /**
     * The {@link NodeId} of the last push.
     * @type {?NodeId}
     */
    this._lastPushed = null;
  }

  /**
   * Waits for a watcher (which can actually be any kind of {@link events~Emitter}) to emit a
   * 'ready' event.
   * @param {events~Emitter} watcher The watcher to wait for.
   * @return {Promise<events~Emitter, Error>} Fulfilled with the set up watcher or rejected with the
   * watcher error that occurred while waiting for it to get ready.
   */
  _waitForWatcher(watcher) {
    return new Promise((resolve, reject) => {
      watcher.on('error', err => reject(err));
      watcher.on('ready', () => resolve(watcher));
    });
  }

  /**
   * Starts a file watcher for the directory {@link WatchTask#directoryToWatch}.
   * @return {Promise<sane~Watcher, Error>} Fulfilled with the file watcher once it is ready or
   * rejected with the error that occurred while starting the watcher.
   */
  startFileWatcher() {
    return (0, _fs.validateDirectoryExists)(_ProjectConfig2.default.RelativeSourceDirectoryPath).catch(err => {
      if (err.code === 'ENOENT') {
        _gulplog2.default.info(`Create a directory at ${_ProjectConfig2.default.RelativeSourceDirectoryPath}`, 'or run "atscm pull" first');

        Object.assign(err, {
          message: `Directory ${_ProjectConfig2.default.RelativeSourceDirectoryPath} does not exist`
        });
      }

      throw err;
    }).then(() => this._waitForWatcher((0, _sane2.default)(_ProjectConfig2.default.RelativeSourceDirectoryPath, {
      glob: '**/*.*',
      watchman: process.platform === 'darwin'
    })));
  }

  /**
   * Starts a watcher that watches the atvise server for changes.
   * @return {Promise<Watcher, Error>} Fulfilled with the server watcher once it is ready or
   * rejected with the error that occurred while starting the watcher.
   */
  startServerWatcher() {
    return this._waitForWatcher(new _Watcher2.default());
  }

  /**
   * Initializes {@link WatchTask#browserSyncInstance}.
   */
  initBrowserSync() {
    this.browserSyncInstance.init({
      proxy: {
        target: `${_ProjectConfig2.default.host}:${_ProjectConfig2.default.port.http}`,
        ws: true
      }
      // logLevel: 'debug', FIXME: Use log level specified in cli options
      // logPrefix: '',
    });

    /* bs.logger.logOne = function(args, msg, level, unprefixed) {
      args = args.slice(2);
       if (this.config.useLevelPrefixes && !unprefixed) {
        msg = this.config.prefixes[level] + msg;
      }
       msg = this.compiler.compile(msg, unprefixed);
       args.unshift(msg);
       Logger[level](format(...args));
       this.resetTemps();
       return this;
    }; */
  }

  /**
   * Handles a file change.
   * @param {string} path The path of the file that changed.
   * @param {string} root The root of the file that changed.
   * @param {fs~Stats} stats The stats of the file that changed.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a push operation,
   * with `false` otherwise.
   */
  handleFileChange(path, root, stats) {
    return new Promise(resolve => {
      if (!this._pulling && _AtviseFile2.default.normalizeMtime(stats.mtime) > this._lastPull) {
        const nodePath = (0, _path.dirname)(path);
        let nodeId = {};

        nodeId = _NodeId2.default.fromFilePath(nodePath);

        if (nodeId.toString() !== this._lastPulled) {
          const pushStream = new _PushStream2.default({
            nodesToPush: [nodeId],
            createNodes: false
          });

          this._pushing = true;
          _gulplog2.default.info('File change:', path, 'changed');

          pushStream.on('write-successful', file => {
            this._lastPushed = file.nodeId.toString();
          }).on('finish', () => {
            this._pushing = false;
            this.browserSyncInstance.reload();

            resolve(true);
          });
        }
      } else {
        resolve(false);
      }
    });
  }
  /**
   * Handles an atvise server change.
   * @param {ReadNodeItem} readNodeMappingItem The resultung rad node mapping
   * item of the modification.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a pull operation,
   * with `false` otherwise.
   */
  handleServerChange(readNodeMappingItem) {
    return new Promise(resolve => {
      if (!this._pushing) {
        const nodeId = readNodeMappingItem.nodeId.toString();

        if (nodeId !== this._lastPushed) {
          const readStream = (0, _through.obj)();
          this._pulling = true;

          _gulplog2.default.info('Server change:', nodeId, 'changed');
          readStream.write(readNodeMappingItem);
          readStream.end();

          const pullStream = new _PullStream2.default({
            useInputStream: true,
            inputStream: readStream
          });

          pullStream.on('end', () => {
            this._pulling = false;
            this._lastPull = _AtviseFile2.default.normalizeMtime(readNodeMappingItem.configObj.mtime);
            this.browserSyncInstance.reload();

            resolve(true);
          });
        } else {
          this._lastPushed = null;

          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Starts the file and server watchers, initializes Browsersync and registers change event
   * handlers.
   * @return {Promise<undefined, Error>} Fulfilled once all watchers are set up and Browsersync was
   * initialized.
   */
  run() {
    return Promise.all([this.startFileWatcher(), this.startServerWatcher()]).then(([fileWatcher, serverWatcher]) => {
      this.browserSyncInstance.emitter.on('service:running', () => {
        _gulplog2.default.info('Watching for changes...');
        _gulplog2.default.info('Press Ctrl-C to exit');
      });

      fileWatcher.on('change', this.handleFileChange.bind(this));
      // Rename von Files, Anlegen von neuen Files usw hier hinzufügen
      serverWatcher.on('change', this.handleServerChange.bind(this));

      this.initBrowserSync();
    });
  }

}

exports.WatchTask = WatchTask; /**
                                * The gulp task invoced when running `atscm watch`.
                                * @return {Promise<undefined, Error>} Fulfilled once all watchers are set up and Browsersync was
                                * initialized.
                                */

function watch() {
  return new WatchTask().run();
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
//# sourceMappingURL=watch.js.map