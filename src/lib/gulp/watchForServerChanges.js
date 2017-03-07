import Logger from 'gulplog';
import Watcher from '../server/Watcher';

/**
 * Returns a fully set up gulp task that watches atvise server nodes for value changes.
 * @param {function(path: String, root: String, stat: Object)} listener Called when a node changes.
 * @return {function()} The resulting gulp task.
 */
export default function watchForServerChanges(listener) {
  return () => new Watcher()
      .on('change', data => listener(data))
      .on('ready', () => Logger.info('Waiting for server changes...'));
}
