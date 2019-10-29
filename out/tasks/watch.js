"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = watch;
exports.WatchTask = void 0;

var _path = require("path");

var _sane = _interopRequireDefault(require("sane"));

var _browserSync = _interopRequireDefault(require("browser-sync"));

var _gulplog = _interopRequireDefault(require("gulplog"));

var _Watcher = _interopRequireDefault(require("../lib/server/Watcher"));

var _async = require("../lib/helpers/async");

var _tasks = require("../lib/helpers/tasks");

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig"));

var _fs = require("../util/fs");

var _pull = require("./pull");

var _push = require("./push");

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
    this.browserSyncInstance = _browserSync.default.create();
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
   * The directory to watch.
   * @type {string}
   */


  get directoryToWatch() {
    return './src';
  }
  /**
   * Waits for a watcher (which can actually be any kind of {@link events~Emitter}) to emit a
   * "ready" event.
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
    return (0, _fs.validateDirectoryExists)(this.directoryToWatch).catch(err => {
      if (err.code === 'ENOENT') {
        _gulplog.default.info(`Create a directory at ${this.directoryToWatch} or run \`atscm pull\` first`);

        Object.assign(err, {
          message: `Directory ${this.directoryToWatch} does not exist`
        });
      }

      throw err;
    }).then(() => this._waitForWatcher((0, _sane.default)(this.directoryToWatch, {
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
    return this._waitForWatcher(new _Watcher.default());
  }
  /**
   * Initializes {@link WatchTask#browserSyncInstance}.
   * @param {Object} options The options to pass to browsersync.
   * @see https://browsersync.io/docs/options
   */


  initBrowserSync(options) {
    this.browserSyncInstance.init(Object.assign({
      proxy: `${_ProjectConfig.default.host}:${_ProjectConfig.default.port.http}`,
      ws: true // logLevel: 'debug', FIXME: Use log level specified in cli options
      // logPrefix: '',

    }, options));
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
   * Prints an error that happened while handling a change.
   * @param {string} contextMessage Describes the currently run action.
   * @param {Error} err The error that occured.
   */


  printTaskError(contextMessage, err) {
    try {
      (0, _tasks.handleTaskError)(err);
    } catch (refined) {
      _gulplog.default.error(contextMessage, refined.message, refined.stack);
    }
  }
  /**
   * Handles a file change.
   * @param {string} path The path of the file that changed.
   * @param {string} root The root of the file that changed.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a push operation,
   * with `false` otherwise.
   */


  handleFileChange(path, root) {
    if (this._handlingChange) {
      _gulplog.default.debug('Ignoring', path, 'changed');

      return Promise.resolve(false);
    }

    this._handlingChange = true;

    _gulplog.default.info(path, 'changed');

    return (0, _push.performPush)((0, _path.join)(root, path), {
      singleNode: true
    }).catch(err => this.printTaskError('Push failed', err)).then(async () => {
      this.browserSyncInstance.reload();
      await (0, _async.delay)(500);
      this._handlingChange = false;
    });
  }
  /**
   * Handles an atvise server change.
   * @param {ReadStream.ReadResult} readResult The read result of the modification.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a pull operation,
   * with `false` otherwise.
   */


  handleServerChange(readResult) {
    if (this._handlingChange) {
      _gulplog.default.debug('Ignoring', readResult.nodeId.value, 'changed');

      return Promise.resolve(false);
    }

    this._handlingChange = true;

    _gulplog.default.info(readResult.nodeId.value, 'changed');

    return (0, _pull.performPull)([readResult.nodeId], {
      recursive: false
    }).catch(err => this.printTaskError('Pull failed', err)).then(async () => {
      this.browserSyncInstance.reload();
      await (0, _async.delay)(500);
      this._handlingChange = false;
    });
  }
  /**
   * Starts the file and server watchers, initializes Browsersync and registers change event
   * handlers.
   * @param {Object} [options] The options to pass to browsersync.
   * @param {boolean} [options.open=true] If the browser should be opened once browsersync is up.
   * @return {Promise<{ serverWatcher: Watcher, fileWatcher: sane~Watcher }, Error>} Fulfilled once
   * all watchers are set up and Browsersync was initialized.
   */


  run({
    open = true
  } = {}) {
    return Promise.all([this.startFileWatcher(), this.startServerWatcher()]).then(([fileWatcher, serverWatcher]) => {
      this.browserSyncInstance.emitter.on('service:running', () => {
        _gulplog.default.info('Watching for changes...');

        _gulplog.default.debug('Press Ctrl-C to exit');
      });
      fileWatcher.on('change', this.handleFileChange.bind(this));
      serverWatcher.on('change', this.handleServerChange.bind(this));
      this.initBrowserSync({
        open
      });
      return {
        fileWatcher,
        serverWatcher
      };
    });
  }

}
/**
 * The gulp task invoced when running `atscm watch`.
 * @param {Object} options The options to pass to the watch task, see {@link WatchTask#run} for
 * available options.
 * @return {Promise<{ serverWatcher: Watcher, fileWatcher: sane~Watcher }, Error>} Fulfilled once
 * all watchers are set up and Browsersync was initialized.
 */


exports.WatchTask = WatchTask;

function watch(options) {
  return new WatchTask().run(options);
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
//# sourceMappingURL=watch.js.map