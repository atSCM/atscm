import Emitter from 'events';
import proxyquire from 'proxyquire';
import { obj as createThroughStream } from 'through2';
import { spy, stub } from 'sinon';
import expect from '../../expect';
import watch, { WatchTask } from '../../../src/tasks/watch';
import NodeId from '../../../src/lib/model/opcua/NodeId';

class TestEmitter extends Emitter {

  constructor(name, payload = true, delay = 1) {
    super();

    setTimeout(() => this.emit(name, payload), delay);
  }

}

class NoopStream {

  constructor(otherStream) {
    return otherStream.pipe(createThroughStream()).on('data', () => {});
  }

}

const stubGulp = {
  src(path, options) {
    const stream = createThroughStream();
    stream.write(Object.assign({}, options, { path, nodeId: 'source node id' }));
    stream.end();

    return stream;
  },
};

const stubModule = proxyquire('../../../src/tasks/watch', {
  sane: () => new TestEmitter('ready', 1),
  'browser-sync': {
    create() {
      return {
        init() {
          this.emitter.emit('service:running', true);
        },
        emitter: new TestEmitter(),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        reload() {},
      };
    },
  },
  gulp: stubGulp,
  '../util/fs': {
    validateDirectoryExists: () => Promise.resolve(true),
  },
  '../lib/server/Watcher': {
    default: class extends TestEmitter {

      constructor() { super('ready', 1); }

    },
  },
  '../lib/gulp/PullStream': { default: NoopStream },
  '../lib/gulp/PushStream': { default: NoopStream },
});

const StubWatchTask = stubModule.WatchTask;
const stubWatch = stubModule.default;

/** @test {WatchTask} */
describe('WatchTask', function() {
  /** @test {WatchTask#constructor} */
  describe('#constructor', function() {
    it('should create a new browser-sync instance', function() {
      expect((new WatchTask()).browserSyncInstance, 'to be defined');
    });
  });

  /** @test {WatchTask#_waitForWatcher} */
  describe('#_waitForWatcher', function() {
    it('should be rejected on error', function() {
      const task = new WatchTask();
      const fakeWatcher = new TestEmitter('error', new Error('Test error'));

      return expect(task._waitForWatcher(fakeWatcher), 'to be rejected with', 'Test error');
    });

    it('should be fulfilled on ready', function() {
      const task = new WatchTask();
      const fakeWatcher = new TestEmitter('ready');

      return expect(task._waitForWatcher(fakeWatcher), 'to be fulfilled');
    });
  });

  /** @test {WatchTask#startFileWatcher} */
  describe('#startFileWatcher', function() {
    it('should fail if directory does not exist', function() {
      class FailingTask extends WatchTask {

        get directoryToWatch() { return './does-not-exist'; }

      }

      const task = new FailingTask();

      return expect(task.startFileWatcher(), 'to be rejected with', /does not exist/);
    });

    it('should fail if fs#stat fails', function() {
      class FailingTask extends WatchTask {

        get directoryToWatch() { return 13; }

      }

      const task = new FailingTask();

      return expect(task.startFileWatcher(), 'to be rejected with',
        /"?Path"?.* must be (a|of type) string/i);
    });

    it('should call #_waitForWatcher', function() {
      const task = new StubWatchTask();
      spy(task, '_waitForWatcher');

      return expect(task.startFileWatcher(), 'to be fulfilled')
        .then(() => expect(task._waitForWatcher, 'was called once'));
    });
  });

  /** @test {WatchTask#startServerWatcher} */
  describe('#startServerWatcher', function() {
    it('should call #_waitForWatcher', function() {
      const task = new StubWatchTask();
      spy(task, '_waitForWatcher');

      return expect(task.startServerWatcher(), 'to be fulfilled')
        .then(() => expect(task._waitForWatcher, 'was called once'));
    });
  });

  /** @test {WatchTask#initBrowserSync} */
  describe('#initBrowserSync', function() {
    it('should call BrowserSync#init', function() {
      const task = new WatchTask();
      stub(task.browserSyncInstance, 'init').returns(true);

      task.initBrowserSync();
      expect(task.browserSyncInstance.init, 'was called once');
    });
  });

  /** @test {WatchTask#handleFileChange} */
  describe('#handleFileChange', function() {
    it.skip('should not do anything when lately pulled files change', function() {
      const task = new StubWatchTask();

      return expect(task.handleFileChange('./path.file', './src', { mtime: new Date(-10000) }),
        'to be fulfilled with', false);
    });

    it('should not do anything while pulling', function() {
      const task = new StubWatchTask();
      task._handlingChange = true;

      return expect(task.handleFileChange('./path.file', './src', { mtime: new Date(Date.now()) }),
        'to be fulfilled with', false);
    });

    it.skip('should push changed files', function() {
      const task = new StubWatchTask();

      return expect(task.handleFileChange('./path.file', './src', { mtime: new Date(Date.now()) }),
        'to be fulfilled with', true);
    });

    it.skip('should reload browser', function() {
      const task = new StubWatchTask();
      spy(task.browserSyncInstance, 'reload');

      return expect(task.handleFileChange('./path.file', './src', { mtime: new Date(Date.now()) }),
        'to be fulfilled with', true)
        .then(() => expect(task.browserSyncInstance.reload, 'was called once'));
    });
  });

  /** @test {WatchTask#handleServerChange} */
  describe('#handleServerChange', function() {
    it('should do nothing while pushing', function() {
      const task = new StubWatchTask();
      task._handlingChange = true;

      return expect(task.handleServerChange({
        nodeId: new NodeId('AGENT.OBJECTS.Test'),
      }), 'to be fulfilled with', false);
    });

    it.skip('should do nothing when handling node that was just pushed', function() {
      const task = new StubWatchTask();
      task._lastPushed = 'ns=13;s=Test';

      return expect(task.handleServerChange({ nodeId: task._lastPushed }),
        'to be fulfilled with', false);
    });

    it.skip('should pull changed nodes', function() {
      const task = new StubWatchTask();

      return expect(task.handleServerChange({ nodeId: 'ns=13;s=Test', mtime: new Date() }),
        'to be fulfilled with', true);
    });
  });

  /** @test {WatchTask#run} */
  describe('#run', function() {
    it('should fail if file watcher errors', function() {
      const task = new StubWatchTask();
      task.startFileWatcher = () => Promise.reject(new Error('Test'));

      return expect(task.run(), 'to be rejected with', 'Test');
    });

    it('should fail if server watcher errors', function() {
      const task = new StubWatchTask();
      task.startServerWatcher = () => Promise.reject(new Error('Test'));

      return expect(task.run(), 'to be rejected with', 'Test');
    });

    it('should init browser sync', function() {
      const task = new StubWatchTask();
      stub(task.browserSyncInstance, 'init').callsFake(() => {
        task.browserSyncInstance.emitter.emit('service:running', true);
      });

      return expect(task.run(), 'to be fulfilled')
        .then(() => expect(task.browserSyncInstance.init, 'was called once'));
    });
  });
});

/** @test {watch} */
describe('watch', function() {
  it('should export a function', function() {
    expect(watch, 'to be a', 'function');
  });

  it('should resolve once watchers are ready', function() {
    return expect(stubWatch(), 'to be fulfilled');
  });

  it('should export a description', function() {
    expect(watch.description, 'to be defined');
  });
});
