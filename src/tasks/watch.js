import { join } from 'path';
import { src } from 'gulp';
import browserSync from 'browser-sync';
import Logger from 'gulplog';
import { obj as createStream } from 'through2';
import watchForFileChanges from '../lib/gulp/watchForFileChanges';
import watchForServerChanges from '../lib/gulp/watchForServerChanges';
import PushStream from '../lib/gulp/PushStream';
import PullStream from '../lib/gulp/PullStream';
import AtviseFile from '../lib/server/AtviseFile';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Watches local files and atvise server nodes to trigger pull/push on change.
 */
export default function watch() {
  let fileWatcher;
  let serverWatcher;
  const browserSyncInstance = browserSync.create();

  let pulling = false;
  let pushing = false;
  let lastPull = 0;
  let lastPushed = null;

  function initBrowserSync() {
    return new Promise((resolve) => {
      let ready = 0;

      function initIfReady() {
        ready++;

        if (ready === 2) {
          browserSyncInstance.init({
            proxy: {
              target: `${ProjectConfig.host}:${ProjectConfig.port.http}`,
              ws: true,
            },
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
      fileWatcher = watchForFileChanges((path, root, stat) => {
        if (!pulling && AtviseFile.normalizeMtime(stat.mtime) > lastPull) {
          pushing = true;
          Logger.info(path, 'changed');

          const source = src(join(root, path), { base: root });

          (new PushStream(source))
            .on('data', file => (lastPushed = file.nodeId.toString()))
            .on('end', () => {
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
      serverWatcher = watchForServerChanges(readResult => {
        if (!pushing) {
          if (readResult.nodeId.toString() !== lastPushed) {
            pulling = true;
            Logger.info(readResult.nodeId.toString(), 'changed');

            const readStream = createStream();
            readStream.write(readResult);
            readStream.end();

            (new PullStream(readStream))
              .on('end', () => {
                pulling = false;
                lastPull = AtviseFile.normalizeMtime(readResult.mtime);
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

  const promise = Promise.all([
    startFileWatcher(),
    startServerWatcher(),
  ]);

  initBrowserSync();

  promise.browserSync = browserSyncInstance;
  promise.fileWatcher = fileWatcher;
  promise.serverWatcher = serverWatcher;

  return promise;
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
