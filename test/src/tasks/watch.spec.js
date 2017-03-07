import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { spy } from 'sinon';
import watch from '../../../src/tasks/watch';

const stubWatchFiles = spy(cb => cb());
const stubWatchServer = spy(cb => cb());
const stubWatch = proxyquire('../../../src/tasks/watch', {
  '../lib/gulp/watchForFileChanges': { _esModule: true, default: () => stubWatchFiles },
  '../lib/gulp/watchForServerChanges': { _esModule: true, default: () => stubWatchServer },
}).default;

/** @test {watch} */
describe('watch', function() {
  it('should return a function', function() {
    expect(watch, 'to be a', 'function');
  });

  it('should call watchFile/Server functions', function(done) {
    stubWatch(() => {
      expect(stubWatchFiles.calledOnce, 'to be', true);
      expect(stubWatchServer.calledOnce, 'to be', true);
      done();
    });
  });

  // FIXME: Need additional tests that actually subscribe nodes / watch files
});
