'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _which = require('which');

var _which2 = _interopRequireDefault(_which);

var _Logger = require('./Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A static class providing utilities to run external commands.
 */
class ExternalCommand {

  /**
   * Resolves the executable path for the given command.
   * @param {string} name The command to resolve.
   * @return {Promise<string, Error>} Fulfilled with the executable path or the error that occured
   * while running `which`.
   */
  static resolveBin(name) {
    return new Promise((resolve, reject) => {
      (0, _which2.default)(name, (err, path) => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  }

  /**
   * Spawns an executable with the given args and options. See the [node.js docs on the
   * `child_process` module](https://nodejs.org/api/child_process.html#child_process_child_process)
   * for all available spawn options.
   * @param {string} bin Path to the executable to run.
   * @param {string[]} [args=[]] The arguments to use.
   * @param {Object} [options] The options to use.
   * @param {Object} [options.spawn] Options to use for the spawned process.
   * @param {function(process: node.ChildProcess)} [options.onspawn] Callback to call once the
   * process was created. Useful for handling stdio events etc.
   * @return {Promise<string, Error>} Fulfilled with the child process' stdout or rejected with a
   * spawn error or non-zero exit code.
   */
  static spawn(bin, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      let stdout = '';

      _Logger2.default.debug('Running', _Logger2.default.format.command(`${bin} ${args.join(' ')}`));
      const child = (0, _child_process.spawn)(bin, args, options.spawn || options).once('error', err => reject(err)).once('close', code => {
        if (code > 0) {
          reject(new Error(`${bin} ${args.join(' ')} returned code ${code}`));
        } else {
          resolve(stdout.trim());
        }
      });

      child.stdout.on('data', d => stdout += d.toString());

      if (options.onspawn) {
        options.onspawn(child);
      }
    });
  }

  /**
   * Resolves the executable for the given command and runs it with the arguments and options given.
   * See the [node.js docs on the
   * `child_process` module](https://nodejs.org/api/child_process.html#child_process_child_process)
   * for all available spawn options.
   * @param {string} name The command to run.
   * @param {string[]} [args] The arguments to use.
   * @param {Object} [options] The options to use.
   * @param {Object} [options.spawn] Options to use for the spawned process.
   * @param {function(process: node.ChildProcess)} [options.onspawn] Callback to call once the
   * process was created. Useful for handling stdio events etc.
   * @return {Promise<string, Error>} Fulfilled with the child process' stdout or rejected with a
   * spawn error, a non-zero exit code or an error that occured while running `which`.
   */
  static run(name, args, options) {
    return this.resolveBin(name).then(bin => this.spawn(bin, args, options));
  }

}
exports.default = ExternalCommand;
//# sourceMappingURL=ExternalCommand.js.map