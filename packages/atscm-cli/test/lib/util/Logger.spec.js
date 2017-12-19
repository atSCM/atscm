/* eslint-disable no-console */
import expect from 'unexpected';
import { stub } from 'sinon';
import gulplog from 'gulplog';
import { obj as createStream } from 'through2';
import Logger from '../../../src/lib/util/Logger';

/** @test {LogFormat} */
describe('LogFormat', function() {
  const text = 'Test string';

  const orgEnabled = Logger.colors.supportsColor;
  before(() => (Logger.colors.enabled = true));
  after(() => (Logger.colors.enabled = orgEnabled));

  function expectStyle(styledText, style) {
    const { open, close } = style._styles[0];
    expect(styledText, 'to equal', `${open}${text}${close}`);
  }

  /** @test {LogFormat.path} */
  describe('.path', function() {
    it('should change color to magenta', function() {
      expectStyle(Logger.format.path(text), Logger.colors.magenta);
    });

    it('should prettify user path', function() {
      expect(Logger.format.path(process.env.HOME), 'to contain', '~');
    });
  });

  /** @test {LogFormat.command} */
  describe('.command', function() {
    it('should return bold text', function() {
      expectStyle(Logger.format.command(text), Logger.colors.bold);
    });
  });

  /** @test {LogFormat.value} */
  describe('.value', function() {
    it('should return cyan colored text', function() {
      expectStyle(Logger.format.value(text), Logger.colors.cyan);
    });
  });

  /** @test {LogFormat.number} */
  describe('.number', function() {
    it('should return magenta colored text', function() {
      expectStyle(Logger.format.number(text), Logger.colors.magenta);
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
    debugSpy = stub(gulplog, 'debug');
    infoSpy = stub(gulplog, 'info');
    warnSpy = stub(gulplog, 'warn');
    errorSpy = stub(gulplog, 'error');
  });

  afterEach(function() {
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

  /** @test {Logger.applyOptions} */
  describe('.applyOptions', function() {
    afterEach(() => {
      Logger.types.forEach(name => gulplog.removeAllListeners(name));
    });

    function expectListeners(levels) {
      Logger.types.forEach((name, i) => {
        expect(gulplog.listenerCount(name), 'to equal', levels[i] ? 1 : 0);
      });
    }

    context('when using option "silent"', function() {
      it('should only add a noop listener for "error" events', function() {
        Logger.applyOptions({ silent: true });

        expectListeners([true, false, false, false]);
      });
    });

    context('when using "logLevel" 0', function() {
      it('should only add a noop listener for "error" events', function() {
        Logger.applyOptions({ logLevel: 0 });

        expectListeners([true, false, false, false]);
      });
    });

    context('when using "logLevel" 1', function() {
      it('should only add a listener for "error" events', function() {
        Logger.applyOptions({ logLevel: 1 });

        expectListeners([true, false, false, false]);
      });
    });

    context('when using "logLevel" 2', function() {
      it('should add listeners for "error" and "warn" events', function() {
        Logger.applyOptions({ logLevel: 2 });

        expectListeners([true, true, false, false]);
      });
    });

    context('when using "logLevel" 3', function() {
      it('should add listeners for "error", "warn" and "info" events', function() {
        Logger.applyOptions({ logLevel: 3 });

        expectListeners([true, true, true, false]);
      });
    });

    context('when using "logLevel" 4', function() {
      it('should add listeners for all events', function() {
        Logger.applyOptions({ logLevel: 4 });

        expectListeners([true, true, true, true]);
      });
    });
  });

  /** @test {Logger.pipeLastLine} */
  describe('.pipeLastLine', function() {
    it('should print last line of each chunk', function(done) {
      const stream = createStream((c, e, cb) => cb(null, c));

      Logger.pipeLastLine(stream);

      stream.on('end', () => {
        expect(gulplog.info.callCount, 'to be', 2);
        expect(gulplog.info.getCall(0).args[0], 'to match', /last 1$/);
        expect(gulplog.info.lastCall.args[0], 'to match', /last 2$/);

        done();
      });

      stream.push('first\nlast 1'); // should log [HH:MM:SS] last 1
      stream.push('first\nlast 2'); // should log [HH:MM:SS] last 2
      stream.end();
    });

    it('should ignore empty lines', function(done) {
      const stream = createStream((c, e, cb) => cb(null, c));

      Logger.pipeLastLine(stream);

      stream.on('end', () => {
        expect(gulplog.info.callCount, 'to be', 2);
        expect(gulplog.info.getCall(0).args[0], 'to match', /last 1$/);
        expect(gulplog.info.lastCall.args[0], 'to match', /last 2$/);

        done();
      });

      stream.push('first\nlast 1\n'); // should log [HH:MM:SS] last 1
      stream.push('first\nlast 2\n '); // should log [HH:MM:SS] last 2
      stream.end();
    });
  });
});
