'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanup;

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Session = require('../lib/server/Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Cleans up after the app ended with the specified code or signal.
 * @param {?Number} exitCode The exit code received.
 * @param {?string} signal The signal that triggered the exit.
 * @param {function()} uninstall
 * @return {boolean} `true` if the process should continue exiting.
 */
function cleanup(exitCode, signal, uninstall) {
  uninstall();

  if (signal === 'SIGINT') {
    _readline2.default.clearLine(process.stdout);
    _readline2.default.cursorTo(process.stdout, 0);
    _gulplog2.default.warn('Ctrl-C');
  }

  _gulplog2.default.debug('Running cleanup...');

  if (_Session2.default.open.length > 0) {
    _gulplog2.default.debug('  Closing', _Session2.default.open.length, 'open sessions...');

    // Ignore further gulp error messages
    _gulplog2.default.removeAllListeners('error');
    _gulplog2.default.on('error', () => {});

    _Session2.default.closeOpen().then(() => process.kill(process.pid, signal)).catch(e => {
      _gulplog2.default.error('Error in cleanup', e.message);
      process.kill(process.pid, signal);
    });

    return false;
  }

  return true;
}
//# sourceMappingURL=cleanup.js.map