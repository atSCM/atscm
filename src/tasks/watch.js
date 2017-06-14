import { join } from 'path';
import { src } from 'gulp';
import sane from 'sane';
import browserSync from 'browser-sync';
import Logger from 'gulplog';
import { obj as createStream } from 'through2';
import PushStream from '../lib/gulp/PushStream';
import PullStream from '../lib/gulp/PullStream';
import AtviseFile from '../lib/server/AtviseFile';
import ServerWatcher from '../lib/server/Watcher';
import ProjectConfig from '../config/ProjectConfig';
import { validateDirectoryExists } from '../util/fs';

export class WatchTask {

  constructor() {
    this.browserSyncInstance = browserSync.create();

    this.pulling = false;
    this.pushing = false;
    this.lastPull = 0;
    this.lastPushed = null;
  }

  get directoryToWatch() {
    return './src';
  }

  _waitForWatcher(watcher) {
    return new Promise((resolve, reject) => {
      watcher.on('error', err => reject(err));
      watcher.on('ready', () => resolve(watcher));
    });
  }

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

  startServerWatcher() {
    return this._waitForWatcher(new ServerWatcher());
  }

  initBrowserSync() {
    this.browserSyncInstance.init({
      proxy: `${ProjectConfig.host}:${ProjectConfig.port.http}`,
      ws: true,
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

  handleFileChange(path, root, stat) {
    return new Promise(resolve => {
      if (!this.pulling && AtviseFile.normalizeMtime(stat.mtime) > this.lastPull) {
        this.pushing = true;
        Logger.info(path, 'changed');

        const source = src(join(root, path), { base: root });

        (new PushStream(source))
          .on('data', file => (this.lastPushed = file.nodeId.toString()))
          .on('end', () => {
            this.pushing = false;
            this.browserSyncInstance.reload();

            resolve(true);
          });
      } else {
        resolve(false);
      }
    });
  }

  handleServerChange(readResult) {
    return new Promise(resolve => {
      if (!this.pushing) {
        if (readResult.nodeId.toString() !== this.lastPushed) {
          this.pulling = true;
          Logger.info(readResult.nodeId.toString(), 'changed');

          const readStream = createStream();
          readStream.write(readResult);
          readStream.end();

          (new PullStream(readStream))
            .on('end', () => {
              this.pulling = false;
              this.lastPull = AtviseFile.normalizeMtime(readResult.mtime);
              this.browserSyncInstance.reload();

              resolve(true);
            });
        } else {
          this.lastPushed = null;

          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  run() {
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

        this.initBrowserSync();
      });
  }

}

export default function watch() {
  return (new WatchTask()).run();
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
