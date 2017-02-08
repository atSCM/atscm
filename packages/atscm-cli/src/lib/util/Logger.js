import gulplog from 'gulplog';
import toConsole from 'gulp-cli/lib/shared/log/toConsole';
import chalk from 'chalk';
import tildify from 'tildify';

/**
 * Formats strings to be used in the {@link Logger}.
 */
export class LogFormat {

  /**
   * Formats a string to represent a path.
   * @param {String} path The path to format.
   * @return {String} The formatted string.
   */
  static path(path) {
    return chalk.magenta(tildify(path));
  }

  /**
   * Formats a string to represent a command.
   * @param {String} command The command to format.
   * @return {String} The formatted string.
   */
  static command(command) {
    return chalk.bold(command);
  }

  /**
   * Formats a string to represent a value. Use this format for files, module names, etc.
   * @param {String} value The value to format.
   * @return {String} The formatted string.
   */
  static value(value) {
    return chalk.cyan(value);
  }

  /**
   * Formats a string to represent a number. Use this format for times, counts, etc.
   * @param {String} number The value to format.
   * @return {String} The formatted string.
   */
  static number(number) {
    return chalk.magenta(number);
  }

}

/**
 * A logger used in all console outputs.
 * **Should never be instantiated.**
 * Log levels, `--silent`-flags etc. are handled automatically by {@link gulplog}.
 */
export default class Logger {

  /**
   * An instance of {@link chalk}.
   * @type {chalk}
   */
  static get colors() {
    return chalk;
  }

  /**
   * An instance of {@link LogFormat}.
   * @type {LogFormat}
   */
  static get format() {
    return LogFormat;
  }

  /**
   * The prefix added to each log. Should always equal
   * [fancy-logs prefix](https://github.com/js-cli/fancy-log/blob/master/index.js#L8).
   * @type {String}
   */
  static get prefix() {
    function pad(val) {
      return `00${val}`.slice(-2);
    }

    const now = new Date();
    const timestamp = [
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join(':');

    return `[${chalk.gray(timestamp)}]`;
  }

  /**
   * Print debug messages.
   * @param {...String} message The message(s) to print.
   */
  static debug(...message) {
    gulplog.debug(...message);
  }

  /**
   * Print regular logs.
   * @param {...String} message The message(s) to print.
   */
  static info(...message) {
    gulplog.info(...message);
  }

  /**
   * Print warnings.
   * @param {...String} message The message(s) to print.
   */
  static warn(...message) {
    gulplog.warn(...message);
  }

  /**
   * Print error messages.
   * @param {...String} message The message(s) to print.
   */
  static error(...message) {
    gulplog.error(...message);
  }

  /**
   * Apply options to the logger.
   * **Should only be called once.**
   * @param {Object} options Options passed to {@link gulplog}.
   */
  static applyOptions(options) {
    toConsole(gulplog, options);
  }

  /**
   * Pipes a readable stream and logs the last line of each chunk processed.
   * @param {node.stream.Readable} stream The stream to pipe.
   */
  static pipeLastLine(stream) {
    stream
      .on('data', d => {
        const lines = d.toString().split('\n').filter(l => l !== '');

        process.stdout.clearLine();
        process.stdout.write(`\r${Logger.prefix} ${lines[lines.length - 1]}`);
      })
      .on('end', () => {
        process.stdout.clearLine();
        process.stdout.write('\r');
      });
  }

}
