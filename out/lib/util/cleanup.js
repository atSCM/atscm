'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanup;

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Session = require('./lib/server/Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function cleanup(exitCode, signal, uninstall) {
  if (signal) {
    if (signal === 'SIGINT') {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      _gulplog2.default.warn('Ctrl-C');
    }
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

    uninstall();
    return false;
  }

  return true;
}