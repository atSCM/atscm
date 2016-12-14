/* eslint-disable no-console */
import expect from 'unexpected';
import { spy } from 'sinon';

import log from '../../../src/lib/util/log';

log.applyOptions({});

/** @test {LogFormat} */
describe('LogFormat', function() {
  const text = 'Test string';

  function expectStyle(styledText, style) {
    expect(styledText, 'to equal', `${style.open}${text}${style.close}`);
  }

  /** @test {LogFormat.path} */
  describe('#path', function() {
    it('should change color to cyan', function() {
      expectStyle(log.format.path(text), log.colors.styles.cyan);
    });

    it('should prettify user path', function() {
      expect(log.format.path(process.env.HOME), 'to contain', '~');
    });
  });

  /** @test {LogFormat.command} */
  describe('#command', function() {
    it('should return bold text', function() {
      expectStyle(log.format.command(text), log.colors.styles.bold);
    });
  });
});

/** @test {Logger} */
describe('Logger', function() {
  const text = 'Text';

  let logSpy;
  let errorSpy;

  beforeEach(function() {
    logSpy = spy(console, 'log');
    errorSpy = spy(console, 'error');
  });

  afterEach(function() {
    console.log.restore();
    console.error.restore();
  });

  /** @test {Logger.debug} */
  describe('.debug', function() {
    it('should not be printed by default', function() {
      log.debug(text);

      expect(logSpy.calledOnce, 'to be false');
    });
  });

  /** @test {Logger.info} */
  describe('.info', function() {
    it('should be printed to console', function() {
      log.info(text);

      expect(logSpy.calledOnce, 'to be true');
      expect(logSpy.calledWith(text), 'to be true');
    });
  });

  /** @test {Logger.warn} */
  describe('.warn', function() {
    it('should be printed', function() {
      log.warn(text);

      expect(logSpy.calledOnce, 'to be true');
      expect(logSpy.calledWith(text), 'to be true');
    });
  });

  /** @test {Logger.warn} */
  describe('.error', function() {
    it('should be printed using stderr', function() {
      log.error(text);

      expect(errorSpy.calledOnce, 'to be true');
      expect(errorSpy.calledWith(text), 'to be true');
    });
  });


  /** @test {Logger.applyOptions} *
  describe('.applyOptions', function() {
    it('should apply options to gulplog', function() {
      log.applyOptions({ silent: true });

      log.error('Test');

      expect(errorSpy.calledOnce, 'to be false');
    });
  });
   */
});
