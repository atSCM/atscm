import expect from 'unexpected';
import { spy } from 'sinon';
import watchForFileChanges from '../../../../src/lib/gulp/watchForFileChanges';

/** @test {watchForFileChanges} */
describe('watchForFileChanges', function() {
  it('should return a function', function() {
    expect(watchForFileChanges(() => true), 'to be a', 'function');
  });

  it('should call listener on change', function(done) {
    const stubChange = ['filepath', 'root', 'stat'];

    const watcher = watchForFileChanges((...args) => {
      expect(args, 'to equal', stubChange);
      done();
    })();

    watcher.on('ready', () => {
      watcher.emit('change', ...stubChange);
      watcher.close();
    });
  });
});
