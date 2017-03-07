import Logger from 'gulplog';
import Watcher from '../server/Watcher';

export default function watchForServerChanges(listener) {
  return () => new Watcher()
      .on('change', data => listener(data))
      .on('ready', () => Logger.info('Waiting for server changes...'));
}
