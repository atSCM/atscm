'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LogFormat = undefined;

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _console = require('console');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _tildify = require('tildify');

var _tildify2 = _interopRequireDefault(_tildify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logConsole = new _console.Console(process.stdout, process.stderr);

/**
 * Formats strings to be used in the {@link Logger}.
 */
class LogFormat {

  /**
   * Formats a string to represent a path.
   * @param {String} path The path to format.
   * @return {String} The formatted string.
   */
  static path(path) {
    return _chalk2.default.magenta((0, _tildify2.default)(path));
  }

  /**
   * Formats a string to represent a command.
   * @param {String} command The command to format.
   * @return {String} The formatted string.
   */
  static command(command) {
    return _chalk2.default.bold(command);
  }

  /**
   * Formats a string to represent a value. Use this format for files, module names, etc.
   * @param {String} value The value to format.
   * @return {String} The formatted string.
   */
  static value(value) {
    return _chalk2.default.cyan(value);
  }

  /**
   * Formats a string to represent a number. Use this format for times, counts, etc.
   * @param {String} number The value to format.
   * @return {String} The formatted string.
   */
  static number(number) {
    return _chalk2.default.magenta(number);
  }

}

exports.LogFormat = LogFormat; /**
                                * A logger used in all console outputs.
                                * **Should never be instantiated.**
                                * Log levels, `--silent`-flags etc. are handled automatically by {@link gulplog}.
                                */

class Logger {

  /**
   * An instance of {@link chalk}.
   * @type {chalk}
   */
  static get colors() {
    return _chalk2.default;
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
    const timestamp = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(':');

    return `[${_chalk2.default.gray(timestamp)}]`;
  }

  /**
   * Print debug messages.
   * @param {...String} message The message(s) to print.
   */
  static debug(...message) {
    _gulplog2.default.debug(...message);
  }

  /**
   * Print regular logs.
   * @param {...String} message The message(s) to print.
   */
  static info(...message) {
    _gulplog2.default.info(...message);
  }

  /**
   * Print warnings.
   * @param {...String} message The message(s) to print.
   */
  static warn(...message) {
    _gulplog2.default.warn(...message);
  }

  /**
   * Print error messages.
   * @param {...String} message The message(s) to print.
   */
  static error(...message) {
    _gulplog2.default.error(...message);
  }

  /**
   * The log types available.
   * @type {String[]}
   */
  static get types() {
    return ['error', 'warn', 'info', 'debug'];
  }

  /**
   * Apply options to the logger.
   * **Should only be called once.**
   * @param {Object} options Options passed to {@link gulplog}.
   */
  static applyOptions(options) {
    if (options.tasksSimple || options.silent || options.logLevel === 0) {
      _gulplog2.default.on('error', () => {});
      return;
    }

    /**
     * The log types handled.
     * @type {Map<String, Boolean>}
     */
    this._handled = {};

    this.types.filter((item, i) => {
      const handle = i < options.logLevel;

      this._handled[item] = handle;

      return handle;
    }).forEach(level => _gulplog2.default.on(level, (...args) => {
      logConsole[level === 'error' ? 'error' : 'info'](...[this.prefix].concat(args));
    }));
  }

  /**
   * Pipes a readable stream and logs the last line of each chunk processed.
   * @param {node.stream.Readable} stream The stream to pipe.
   */
  static pipeLastLine(stream) {
    let loggedBefore = false;

    stream.on('data', d => {
      const lines = d.toString().split('\n').filter(l => l.trim() !== '');

      if (loggedBefore && this._handled.info) {
        _readline2.default.moveCursor(process.stdout, 0, -1);
        _readline2.default.clearLine(process.stdout);
      }

      Logger.info(lines[lines.length - 1]);
      loggedBefore = true;
    }).on('end', () => {
      if (loggedBefore && this._handled.info) {
        _readline2.default.moveCursor(process.stdout, 0, -1);
        _readline2.default.clearLine(process.stdout);
        _readline2.default.cursorTo(process.stdout, 0);
      }
    });
  }

}
exports.default = Logger;
//# sourceMappingURL=Logger.js.map