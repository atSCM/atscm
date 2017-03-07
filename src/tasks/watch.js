import { join } from 'path';
import { parallel, src } from 'gulp';
import Logger from 'gulplog';
import { obj as createStream } from 'through2';
import watchForFileChanges from '../lib/gulp/watchForFileChanges';
import watchForServerChanges from '../lib/gulp/watchForServerChanges';
import PushStream from '../lib/gulp/PushStream';
import PullStream from '../lib/gulp/PullStream';
import AtviseFile from '../lib/server/AtviseFile';

let pulling = false;
let pushing = false;
let lastPull = 0;
let lastPush = 0;

/**
 * Watches local files and atvise server nodes to trigger pull/push on change.
 */
const watch = parallel(
  watchForFileChanges((path, root, stat) => {
    if (!pulling && AtviseFile.normalizeMtime(stat.mtime) > lastPull) {
      pushing = true;
      Logger.info(path, 'changed');

      const source = src(join(root, path), { base: root });

      (new PushStream(source))
        .on('end', () => {
          pushing = false;
          lastPush = AtviseFile.normalizeMtime(new Date());
        });
    }
  }),
  watchForServerChanges(readResult => {
    if (!pushing && AtviseFile.normalizeMtime(readResult.mtime) > lastPush) {
      pulling = true;
      Logger.info(readResult.nodeId.toString(), 'changed');

      const readStream = createStream();
      readStream.write(readResult);
      readStream.end();

      (new PullStream(readStream))
        .on('end', () => {
          pulling = false;
          lastPull = AtviseFile.normalizeMtime(readResult.mtime);
        });
    }
  })
);

export default watch;

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';
