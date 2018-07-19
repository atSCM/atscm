import { join } from 'path';
import { src } from 'gulp';
import sane from 'sane';
import browserSync from 'browser-sync';
import Logger from 'gulplog';
import PushStream from '../lib/gulp/PushStream';
import PullStream from '../lib/gulp/PullStream';
import AtviseFile from '../lib/server/AtviseFile';
import ServerWatcher from '../lib/server/Watcher';
import ProjectConfig from '../config/ProjectConfig';
import { validateDirectoryExists } from '../util/fs';
import NodeStream from '../lib/server/NodeStream';

/**
 * The task executed when running `atscm watch`.
 */
export class WatchTask {

  /**
   * Creates a new watch task instance. Also creates a new Browsersync instance.
   */
  constructor() {
    /**
     * The Browsersync instance used.
     * @type {events~Emitter}
     */
    this.browserSyncInstance = browserSync.create();

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
    return validateDirectoryExists(this.directoryToWatch)
      .catch(err => {
        if (err.code === 'ENOENT') {
          Logger.info(`Create a directory at ${this.directoryToWatch} or run \`atscm pull\` first`);

          Object.assign(err, {
            message: `Directory ${this.directoryToWatch} does not exist`,
          });
        }

        throw err;
      })
      .then(() => this._waitForWatcher(sane(this.directoryToWatch, {
        glob: '**/*.*',
        watchman: process.platform === 'darwin',
      })));
  }

  /**
   * Starts a watcher that watches the atvise server for changes.
   * @return {Promise<Watcher, Error>} Fulfilled with the server watcher once it is ready or
   * rejected with the error that occurred while starting the watcher.
   */
  startServerWatcher() {
    return this._waitForWatcher(new ServerWatcher());
  }

  /**
   * Initializes {@link WatchTask#browserSyncInstance}.
   * @param {Object} options The options to pass to browsersync.
   * @see https://browsersync.io/docs/options
   */
  initBrowserSync(options) {
    this.browserSyncInstance.init(Object.assign({
      proxy: `${ProjectConfig.host}:${ProjectConfig.port.http}`,
      ws: true,
      // logLevel: 'debug', FIXME: Use log level specified in cli options
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
   * Handles a file change.
   * @param {string} path The path of the file that changed.
   * @param {string} root The root of the file that changed.
   * @param {fs~Stats} stats The stats of the file that changed.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a push operation,
   * with `false` otherwise.
   */
  handleFileChange(path, root, stats) {
    return new Promise(resolve => {
      if (!this._pulling && AtviseFile.normalizeMtime(stats.mtime) > this._lastPull) {
        this._pushing = true;
        Logger.info(path, 'changed');

        const source = src(join(root, path), { base: root });

        (new PushStream(source))
          .on('data', file => (this._lastPushed = file.nodeId.toString()))
          .on('end', () => {
            this._pushing = false;
            this.browserSyncInstance.reload();

            resolve(true);
          });
      } else {
        resolve(false);
      }
    });
  }

  /**
   * Handles an atvise server change.
   * @param {ReadStream.ReadResult} readResult The read result of the modification.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a pull operation,
   * with `false` otherwise.
   */
  handleServerChange(readResult) {
    return new Promise(resolve => {
      if (!this._pushing) {
        if (readResult.nodeId.toString() !== this._lastPushed) {
          this._pulling = true;
          Logger.info(readResult.nodeId.toString(), 'changed');

          // FIXME: Reuse read value
          const stream = new NodeStream([readResult.nodeId], { recursive: false });

          (new PullStream(stream))
            .on('end', () => {
              this._pulling = false;
              this._lastPull = AtviseFile.normalizeMtime(readResult.mtime);
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
   * @param {Object} [options] The options to pass to browsersync.
   * @param {boolean} [options.open=true] If the browser should be opened once browsersync is up.
   * @return {Promise<{ serverWatcher: Watcher, fileWatcher: sane~Watcher }, Error>} Fulfilled once
   * all watchers are set up and Browsersync was initialized.
   */
  run({ open = true } = { open: true }) {
    return Promise.all([
      this.startFileWatcher(),
      this.startServerWatcher(),
    ])
      .then(([fileWatcher, serverWatcher]) => {
        this.browserSyncInstance.emitter.on('service:running', () => {
          Logger.info('Watching for changes...');
          Logger.debug('Press Ctrl-C to exit');
        });

        fileWatcher.on('change', this.handleFileChange.bind(this));
        serverWatcher.on('change', this.handleServerChange.bind(this));

        this.initBrowserSync({ open });

        return { fileWatcher, serverWatcher };
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
export default function watch(options) {
  return (new WatchTask()).run(options);
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
