import sane from 'sane';
import Logger from 'gulplog';

/**
 * Returns a fully set up gulp task that watches the project's source files for changes.
 * @param {function(path: String, root: String, stat: Object)} listener Called when a file changes.
 * @return {function()} The resulting gulp task.
 */
export default function watchForFileChanges(listener) {
  return cb => sane('./src', {
    glob: '**/*.*',
    watchman: ['darwin'].indexOf(process.platform) >= 0,
  })
    .on('change', listener)
    // FIXME: Need to handle `add` and `delete` events
    .on('ready', () => Logger.info('Waiting for file changes...'))
    .on('error', err => cb(err));
}
