import readline from 'readline';
import Logger from 'gulplog';
import Session from '../lib/server/Session';

/**
 * Cleans up after the app ended with the specified code or signal.
 * @param {?Number} exitCode The exit code received.
 * @param {?string} signal The signal that triggered the exit.
 * @param {function()} uninstall
 * @return {boolean} `true` if the process should continue exiting.
 */
export default function cleanup(exitCode, signal, uninstall) {
  uninstall();

  if (signal === 'SIGINT') {
    readline.clearLine(process.stdout);
    readline.cursorTo(process.stdout, 0);
    Logger.warn('Ctrl-C');
  }

  Logger.debug('Running cleanup...');

  if (Session.open.length > 0) {
    Logger.debug('  Closing', Session.open.length, 'open sessions...');

    // Ignore further gulp error messages
    Logger.removeAllListeners('error');
    Logger.on('error', () => {});

    Session.closeOpen()
      .then(() => process.kill(process.pid, signal))
      .catch(e => {
        Logger.error('Error in cleanup', e.message);
        process.kill(process.pid, signal);
      });

    return false;
  }

  return true;
}
