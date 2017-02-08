/* eslint-disable no-console */
import expect from 'unexpected';
import { stub } from 'sinon';

import gulplog from 'gulplog';
import { obj as createStream } from 'through2';
import Logger from '../../../src/lib/util/Logger';

/** @test {LogFormat} */
describe('LogFormat', function() {
  const text = 'Test string';

  function expectStyle(styledText, style) {
    expect(styledText, 'to equal', `${style.open}${text}${style.close}`);
  }

  /** @test {LogFormat.path} */
  describe('.path', function() {
    it('should change color to magenta', function() {
      expectStyle(Logger.format.path(text), Logger.colors.styles.magenta);
    });

    it('should prettify user path', function() {
      expect(Logger.format.path(process.env.HOME), 'to contain', '~');
    });
  });

  /** @test {LogFormat.command} */
  describe('.command', function() {
    it('should return bold text', function() {
      expectStyle(Logger.format.command(text), Logger.colors.styles.bold);
    });
  });

  /** @test {LogFormat.value} */
  describe('.value', function() {
    it('should return cyan colored text', function() {
      expectStyle(Logger.format.value(text), Logger.colors.styles.cyan);
    });
  });

  /** @test {LogFormat.number} */
  describe('.number', function() {
    it('should return magenta colored text', function() {
      expectStyle(Logger.format.number(text), Logger.colors.styles.magenta);
    });
  });
});

/** @test {Logger} */
describe('Logger', function() {
  function getText() {
    return `Text ${(new Date())}`;
  }

  let debugSpy;
  let infoSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(function() {
    stub(process.stdout, 'write');
    debugSpy = stub(gulplog, 'debug');
    infoSpy = stub(gulplog, 'info');
    warnSpy = stub(gulplog, 'warn');
    errorSpy = stub(gulplog, 'error');
  });

  afterEach(function() {
    process.stdout.write.restore();
    gulplog.debug.restore();
    gulplog.info.restore();
    gulplog.warn.restore();
    gulplog.error.restore();
  });

  /** @test {Logger.debug} */
  describe('.debug', function() {
    it('should call gulplog.debug', function() {
      const t = getText();
      Logger.debug(t);

      expect(debugSpy.calledOnce, 'to be', true);
      expect(debugSpy.lastCall.args, 'to equal', [t]);
    });
  });

  /** @test {Logger.info} */
  describe('.info', function() {
    it('should call gulplog.info', function() {
      const t = getText();
      Logger.info(t);

      expect(infoSpy.calledOnce, 'to be', true);
      expect(infoSpy.lastCall.args, 'to equal', [t]);
    });
  });

  /** @test {Logger.warn} */
  describe('.warn', function() {
    it('should call gulplog.warn', function() {
      const t = getText();
      Logger.warn(t);

      expect(warnSpy.calledOnce, 'to be', true);
      expect(warnSpy.lastCall.args, 'to equal', [t]);
    });
  });

  /** @test {Logger.warn} */
  describe('.error', function() {
    it('should call gulplog.error', function() {
      const t = getText();
      Logger.error(t);

      expect(errorSpy.calledOnce, 'to be', true);

      expect(errorSpy.lastCall.args, 'to equal', [t]);
    });
  });

  /** @test {Logger.pipeLastLine} */
  describe('.pipeLastLine', function() {
    it('should print last line of each chunk', function(done) {
      const stream = createStream((c, e, cb) => cb(null, c));

      Logger.pipeLastLine(stream);

      stream.on('end', () => {
        const a = process.stdout.write.args;

        expect(a[a.length - 5][0], 'to match', /last 1$/);
        expect(a[a.length - 3][0], 'to match', /last 2$/);

        done();
      });

      stream.push('first\nlast 1'); // should log [HH:MM:SS] last 1
      stream.push('first\nlast 2'); // should log [HH:MM:SS] last 2
      stream.end();
    });
  });
});
