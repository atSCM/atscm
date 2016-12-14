/**
 * @external {gulplog} https://github.com/gulpjs/gulplog
 */

/**
 * @external {chalk} https://github.com/chalk/chalk
 */

import gulplog from 'gulplog';
import toConsole from 'gulp-cli/lib/shared/log/toConsole';
import chalk from 'chalk';
import tildify from 'tildify';

/**
 * Formats strings to be used in the {@link Logger}
 */
export class LogFormat {

  /**
   * Formats a string to represent a path
   * @param {String} path The path to format
   * @return {String} The formatted string
   */
  static path(path) {
    return chalk.cyan(tildify(path));
  }

  /**
   * Formats a string to represent a command
   * @param {String} command The command to format
   * @return {String} The formatted string
   */
  static command(command) {
    return chalk.bold(command);
  }

}

/**
 * A logger used in all console outputs.
 * **Should never be instantiated.**
 * Log levels, `--silent`-flags etc. are handled automatically by {@link gulplog}.
 */
export default class Logger {

  /**
   * An instance of {@link chalk}
   * @type {chalk}
   */
  static get colors() {
    return chalk;
  }

  /**
   * An instance of {@link LogFormat}
   * @return {LogFormat} formats
   */
  static get format() {
    return LogFormat;
  }

  /**
   * Print debug messages
   * @param {...String} message The message(s) to print
   */
  static debug(...message) {
    gulplog.debug(...message);
  }

  /**
   * Print regular logs
   * @param {...String} message The message(s) to print
   */
  static info(...message) {
    gulplog.info(...message);
  }

  /**
   * Print warnings
   * @param {...String} message The message(s) to print
   */
  static warn(...message) {
    gulplog.warn(...message);
  }

  /**
   * Print error messages
   * @param {...String} message The message(s) to print
   */
  static error(...message) {
    gulplog.error(...message);
  }

  /**
   * Apply options to the logger.
   * **Should only be called once.**
   * @param {Object} options Options passed to {@link gulplog}
   */
  static applyOptions(options) {
    toConsole(gulplog, options);
  }

}
