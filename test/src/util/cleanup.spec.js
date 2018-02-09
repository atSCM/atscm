import expect from 'unexpected';
import { stub, spy } from 'sinon';
import proxyquire from 'proxyquire';
import Logger from 'gulplog';

function createCleanup(numberOfOpenSessions, closeOpenShouldFail) {
  return proxyquire('../../../src/util/cleanup', {
    '../lib/server/Session': {
      __esModule: true,
      default: class Session {

        static get open() {
          return new Array(numberOfOpenSessions);
        }

        static closeOpen() {
          return closeOpenShouldFail ?
            Promise.reject('Session.closeOpen error') :
            Promise.resolve();
        }

      },
    },
  }).default;
}

/** @test {cleanup} */
describe('cleanup', function() {
  before(() => stub(process, 'kill'));
  after(() => process.kill.restore());
  afterEach(() => process.kill.resetHistory());

  it('should call uninstall', function() {
    const uninstall = spy();
    createCleanup(0, false)(null, null, uninstall);

    expect(uninstall.calledOnce, 'to be', true);
  });

  context('when receiving SIGINT', function() {
    it('should log "Ctrl-C"', function() {
      const onWarn = spy();
      Logger.on('warn', onWarn);

      createCleanup(0, false)(null, 'SIGINT', () => {});
      expect(onWarn.calledOnce, 'to be', true);
      expect(onWarn.lastCall.args[0], 'to match', /Ctrl-C/);
    });
  });

  context('with open sessions', function() {
    it('should return false', function() {
      expect(createCleanup(3, false)(null, null, () => {}), 'to be', false);
    });

    it('should call process.kill', function(done) {
      createCleanup(3, false)(null, null, () => {});
      setTimeout(() => {
        expect(process.kill.calledOnce, 'to be', true);
        done();
      }, 10);
    });

    it('should forward Session.closeOpen errors', function(done) {
      createCleanup(3, true)(null, null, () => {});
      setTimeout(() => {
        expect(process.kill.calledOnce, 'to be', true);
        done();
      }, 10);
    });
  });

  context('without open sessions', function() {
    it('should return true', function() {
      expect(createCleanup(0, false)(null, null, () => {}), 'to be', true);
    });
  });
});
