/* eslint-disable import/prefer-default-export */

import readline from 'readline';
import Logger from 'gulplog';

export function reportProgress(task, { getter, formatter, level = 'info', logResult = true } = {}) {
  const start = Date.now();
  const ops = value => (value / ((Date.now() - start) / 1000)).toFixed(1);
  const message = () => {
    const value = getter();
    return `${formatter(value)} (${ops(value)}/s)`;
  };

  const interval = setInterval(() => {
    if (Logger.listenerCount(level) > 0) {
      Logger[level](message());

      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, -1);
    }
  }, 80);

  const done = err => {
    clearInterval(interval);

    if (logResult && !err) {
      Logger[level](message());
    } else if (Logger.listenerCount(level) > 0) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout);
    }

    if (err) {
      throw err;
    }
  };

  return task.then(() => done(), err => done(err));
}
