"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanup;

var _readline = _interopRequireDefault(require("readline"));

var _gulplog = _interopRequireDefault(require("gulplog"));

var _Session = _interopRequireDefault(require("../lib/server/Session"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Cleans up after the app ended with the specified code or signal.
 * @param {?number} exitCode The exit code received.
 * @param {?string} signal The signal that triggered the exit.
 * @param {function()} uninstall The uninstall script to run.
 * @return {boolean} `true` if the process should continue exiting.
 */
function cleanup(exitCode, signal, uninstall) {
  uninstall();

  if (signal === 'SIGINT') {
    _readline.default.clearLine(process.stdout);

    _readline.default.cursorTo(process.stdout, 0);

    _gulplog.default.warn('Ctrl-C');
  }

  _gulplog.default.debug('Running cleanup...');

  if (_Session.default.open.length > 0) {
    _gulplog.default.debug('  Closing', _Session.default.open.length, 'open sessions...'); // Ignore further gulp error messages


    _gulplog.default.removeAllListeners('error');

    _gulplog.default.on('error', () => {});

    _Session.default.closeOpen().then(() => process.kill(process.pid, signal)).catch(e => {
      _gulplog.default.error('Error in cleanup', e.message);

      process.kill(process.pid, signal);
    });

    return false;
  }

  return true;
}
//# sourceMappingURL=cleanup.js.map