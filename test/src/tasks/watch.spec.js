import Emitter from 'events';
import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { obj as createThroughStream } from 'through2';
import { spy } from 'sinon';
import watch from '../../../src/tasks/watch';

class StubBrowserSync {
  init(options, callback) { callback(); }
  reload() {}
}

function watchForStubChanges(listener) {
  return cb => new Emitter()
    .on('change', listener)
    .on('error', err => cb(err))
    .on('close', () => cb());
}

class NoopStream {
  constructor(otherStream) {
    return otherStream.pipe(createThroughStream()).on('data', () => {});
  }
}

const stubWatch = proxyquire('../../../src/tasks/watch', {
  'browser-sync': {
    _esModule: true,
    default: StubBrowserSync,
    create() { return new StubBrowserSync(); },
    '@noCallThru': true,
  },
  gulp: {
    src(path, options) {
      const stream = createThroughStream();
      stream.write(Object.assign({}, options, { path, nodeId: 'source node id' }));
      stream.end();

      return stream;
    },
  },
  '../lib/gulp/watchForFileChanges': { _esModule: true, default: watchForStubChanges },
  '../lib/gulp/watchForServerChanges': { _esModule: true, default: watchForStubChanges },
  '../lib/gulp/PullStream': { __esModule: true, default: NoopStream, '@noCallThru': true },
  '../lib/gulp/PushStream': { __esModule: true, default: NoopStream, '@noCallThru': true },
}).default;

/** @test {watch} */
describe('watch', function() {
  it('should return a function', function() {
    expect(watch, 'to be a', 'function');
  });

  context('when run', function() {
    it('should return a Promise', function() {
      expect(stubWatch(), 'to be a', Promise);
    });

    it('should init browser-sync once watchers are ready', function() {
      const { browserSync, fileWatcher, serverWatcher } = stubWatch();
      spy(browserSync, 'init');

      fileWatcher.emit('ready');
      expect(browserSync.init.callCount, 'to equal', 0);

      serverWatcher.emit('ready');
      expect(browserSync.init.calledOnce, 'to be', true);
    });

    it('should call listeners on file change', function(done) {
      const promise = stubWatch();

      promise.fileWatcher.emit('change', 'root', 'path', { mtime: new Date() });

      promise.browserSync.reload = () => done();
    });

    it('should not call file listeners while pulling', function(done) {
      const promise = stubWatch();

      const readResult = { nodeId: 'fake node id', mtime: new Date() };
      promise.serverWatcher.emit('change', readResult);
      promise.fileWatcher.emit('change', 'root', 'path', { mtime: new Date() });

      promise.browserSync.reload = () => done();
    });

    it('should call listeners on server change', function(done) {
      const promise = stubWatch();

      const readResult = { nodeId: 'fake node id', mtime: new Date() };
      promise.serverWatcher.emit('change', readResult);

      promise.browserSync.reload = () => done();
    });

    it('should not call server listeners while pushing', function(done) {
      const promise = stubWatch();

      const readResult = { nodeId: 'fake node id', mtime: new Date() };
      promise.fileWatcher.emit('change', 'root', 'path', { mtime: new Date() });
      promise.serverWatcher.emit('change', readResult);

      promise.browserSync.reload = () => done();
    });

    it('should not call server listeners when delayed', function(done) {
      const promise = stubWatch();

      promise.fileWatcher.emit('change', 'root', 'path', { mtime: new Date() });
      promise.fileWatcher.once('push', () => {
        const readResult = { nodeId: 'source node id', mtime: new Date() };
        promise.serverWatcher.emit('change', readResult);
        done();
      });
      promise.serverWatcher.once('pull', () => {
        done(new Error('server listener unexpectedly called on delayed change'));
      });
    });

    it('should forward file watcher errors', function() {
      const promise = stubWatch();
      promise.fileWatcher.emit('error', new Error('Test'));

      return expect(promise, 'to be rejected with', 'Test');
    });

    it('should forward server watcher errors', function() {
      const promise = stubWatch();
      promise.serverWatcher.emit('error', new Error('Test'));

      return expect(promise, 'to be rejected with', 'Test');
    });
  });

  // FIXME: Need additional tests that actually subscribe nodes / watch files
});
