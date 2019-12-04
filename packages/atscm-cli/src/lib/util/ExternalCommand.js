import { spawn } from 'child_process';
import which from 'which';
import Logger from './Logger';

/**
 * A static class providing utilities to run external commands.
 */
export default class ExternalCommand {
  /**
   * Resolves the executable path for the given command.
   * @param {string} name The command to resolve.
   * @return {Promise<string, Error>} Fulfilled with the executable path or the error that occured
   * while running `which`.
   */
  static resolveBin(name) {
    return new Promise((resolve, reject) => {
      which(name, (err, path) => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  }

  /**
   * Spawns an executable with the given args and options. See the node docs on the `child_process`
   * module for all available spawn options.
   * @param {string} bin Path to the executable to run.
   * @param {string[]} [args=[]] The arguments to use.
   * @param {Object} [options] The options to use.
   * @param {Object} [options.spawn] Options to use for the spawned process.
   * @param {function(process: node.ChildProcess)} [options.onspawn] Callback to call once the
   * process was created. Useful for handling stdio events etc.
   * @return {Promise<string, Error>} Fulfilled with the child process' stdout or rejected with a
   * spawn error or non-zero exit code.
   * @see {@link node.ChildProcess}
   */
  static spawn(bin, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      let stdout = '';

      Logger.debug('Running', Logger.format.command(`${bin} ${args.join(' ')}`));
      const child = spawn(bin, args, options.spawn || options)
        .once('error', err => reject(err))
        .once('close', code => {
          if (code > 0) {
            reject(new Error(`${bin} ${args.join(' ')} returned code ${code}`));
          } else {
            resolve(stdout.trim());
          }
        });

      child.stdout.on('data', d => (stdout += d.toString()));

      if (options.onspawn) {
        options.onspawn(child);
      }
    });
  }

  /**
   * Resolves the executable for the given command and runs it with the arguments and options given.
   * See the node docs on the `child_process` module for all available spawn options.
   * @param {string} name The command to run.
   * @param {string[]} [args] The arguments to use.
   * @param {Object} [options] The options to use.
   * @param {Object} [options.spawn] Options to use for the spawned process.
   * @param {function(process: node.ChildProcess)} [options.onspawn] Callback to call once the
   * process was created. Useful for handling stdio events etc.
   * @return {Promise<string, Error>} Fulfilled with the child process' stdout or rejected with a
   * spawn error, a non-zero exit code or an error that occured while running `which`.
   * @see {@link node.ChildProcess}
   */
  static run(name, args, options) {
    return this.resolveBin(name).then(bin => this.spawn(bin, args, options));
  }
}
