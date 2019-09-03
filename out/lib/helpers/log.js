"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reportProgress = reportProgress;

var _readline = _interopRequireDefault(require("readline"));

var _gulplog = _interopRequireDefault(require("gulplog"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/prefer-default-export */

/**
 * Prints the progress of a task.
 * @param {Promise<any>} task The task to print the progress for.
 * @param {Object} options The options used.
 * @param {function(): number} options.getter A function returning the current progress.
 * @param {function(value: number): string} options.formatter A function returning a log message for
 * the progress passed.
 * @param {string} [options.level='info'] The log level to use.
 * @param {boolean} [options.logResult=true] If the final progress should be printed.
 * @example <caption>A basic implementation</caption>
 * const task = doSomething(); // Returns a Promise
 *
 * reportProgress(task, {
 *   getter: () => getTaskProgress(), // returns a number, e.g. 13 if 13 files have been written
 *   formatter: value => `${value} files written`,
 * })
 *  .then(result => { // Results get passed directly from `task`
 *    console.log(`The result is: ${result}`);
 *  })
 *  .catch(console.error) // which means you need error handling as well!
 */
function reportProgress(task, {
  getter,
  formatter,
  level = 'info',
  logResult = true
} = {}) {
  const start = Date.now();

  const ops = value => (value / ((Date.now() - start) / 1000)).toFixed(1);

  const message = () => {
    const value = getter();
    return `${formatter(value)} (${ops(value)}/s)`;
  };

  const interval = setInterval(() => {
    if (_gulplog.default.listenerCount(level) > 0) {
      _gulplog.default[level](message());

      _readline.default.cursorTo(process.stdout, 0);

      _readline.default.moveCursor(process.stdout, 0, -1);
    }
  }, 80);

  const done = err => {
    clearInterval(interval);

    if (logResult && !err) {
      _gulplog.default[level](message());
    } else if (_gulplog.default.listenerCount(level) > 0) {
      _readline.default.cursorTo(process.stdout, 0);

      _readline.default.clearLine(process.stdout);
    }

    if (err) {
      throw err;
    }
  };

  return task.then(() => done(), err => done(err));
}
//# sourceMappingURL=log.js.map