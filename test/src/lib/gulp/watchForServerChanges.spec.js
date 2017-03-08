import expect from 'unexpected';
import { spy } from 'sinon';
import watchForServerChanges from '../../../../src/lib/gulp/watchForServerChanges';
import Watcher from '../../../../src/lib/server/Watcher';

/** @test {watchForServerChanges} */
describe('watchForServerChanges', function() {
  it('should return a Watcher', function() {
    expect(watchForServerChanges(() => {})(), 'to be a', Watcher);
  });

  it('should forward change events to listener', function() {
    const listener = spy();
    const watcher = watchForServerChanges(listener)();
    const event = {};

    watcher.emit('change', event);
    expect(listener.calledOnce, 'to be true');
    expect(listener.lastCall.args[0], 'to equal', event);
  });

  it('should call callback on error', function(done) {
    const watcher = watchForServerChanges(() => {})(err => {
      expect(err, 'to have message', 'Test');
      done();
    });

    watcher.emit('error', new Error('Test'));
  });
});
