import Emitter from 'events';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import { resolveNodeId } from 'node-opcua';
import { ctor as throughStreamClass } from 'through2';
import expect from '../../../expect';
import Watcher, { SubscribeStream } from '../../../../src/lib/server/Watcher';

class StubMonitoredItem extends Emitter {

  constructor(error = false) {
    super();

    // Simulate first notification or error
    setTimeout(() => this.emit(error ? 'err' : 'changed', error || {}), 10);
  }

}

const StubWatcher = proxyquire('../../../../src/lib/server/Watcher', {
  './NodeStream': {
    __esModule: true,
    default: class ServerStream extends throughStreamClass({ objectMode: true }) {
      constructor() {
        super();

        setTimeout(() => this.end(), 10);
      }
    },
  },
}).default;

const FailingSubscribeStream = proxyquire('../../../../src/lib/server/Watcher', {
  'node-opcua': {
    ClientSubscription: class StubClientSubscription extends Emitter {
      constructor() {
        super();

        this.monitor = spy(() => new StubMonitoredItem());

        setTimeout(() => this.emit('failure', new Error('ClientSubscription failure')), 10);
      }
    },
  },
}).SubscribeStream;

/** @test {SubscribeStream} */
describe('SubscribeStream', function() {
  /** @test {SubscribeStream#constructor} */
  describe('#constructor', function() {
    it('should apply keepSessionAlive option', function() {
      const stream = new SubscribeStream();
      stream.end();

      expect(stream._keepSessionAlive, 'to be', true);
    });

    it('should not track changes instantly', function() {
      const stream = new SubscribeStream();
      stream.end();

      expect((new SubscribeStream())._trackChanges, 'to be', false);
    });

    context('once session is opened', function() {
      it('should create subscription once session is opened', function(done) {
        const stream = new SubscribeStream();
        spy(stream, 'createSubscription');

        stream.once('session-open', () => {
          expect(stream.createSubscription, 'was called once');
          done();
        });
      });
    });
  });

  /** @test {SubscribeStream#createSubscription} */
  describe('#createSubscription', function() {
    it('should forward errors while creating subscription', function() {
      const stream = new FailingSubscribeStream();

      return expect(stream, 'to error with', /ClientSubscription failure/);
    });

    it('should emit `subscription-started`', function(done) {
      const stream = new SubscribeStream();

      stream.on('subscription-started', () => done());
    });

    it('should set subscription property', function(done) {
      const stream = new SubscribeStream();

      stream.on('subscription-started', subscription => {
        expect(stream.subscription, 'to be defined');
        expect(stream.subscription, 'to be', subscription);
        done();
      });
    });
  });

  /** @test {SubscribeStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should contain node id', function() {
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');
      expect(SubscribeStream.prototype.processErrorMessage({ nodeId }),
        'to contain', nodeId.toString());
    });
  });

  /** @test {SubscribeStream#processChunk} */
  describe('#processChunk', function() {
    it('should call ClientSubscription#monitor', function() {
      const stream = new SubscribeStream();
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      stream.once('subscription-started', subscription => {
        stub(subscription, 'monitor').callsFake(() => new StubMonitoredItem());
      });

      return expect([{ nodeId }], 'when piped through', stream,
        'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(stream.subscription.monitor, 'was called once');
          expect(stream.subscription.monitor.lastCall.args[0], 'to have properties', { nodeId });
        });
    });

    it('should forward MonitoredItem errors', function() {
      const stream = new SubscribeStream();
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      stream.once('subscription-started', subscription => {
        stub(subscription, 'monitor').callsFake(() => new StubMonitoredItem(new Error('item error')));
      });

      return expect([{ nodeId }], 'when piped through', stream, 'to error with', /item error/);
    });

    it('should forward MonitoredItem errors when given as string', function() {
      const stream = new SubscribeStream();
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      stream.once('subscription-started', subscription => {
        stub(subscription, 'monitor').callsFake(() => new StubMonitoredItem('item error'));
      });

      return expect([{ nodeId }], 'when piped through', stream, 'to error with', /item error/);
    });

    it('should forward change events', function() {
      const stream = new SubscribeStream();
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');
      const listener = spy();
      stream.on('change', listener);

      const changeData = {
        value: 'value',
        serverTimestamp: new Date(),
      };

      let item;

      stream.once('subscription-started', subscription => {
        stub(subscription, 'monitor').callsFake(() => {
          item = new StubMonitoredItem(false);
          return item;
        });
      });

      return expect([{ nodeId }], 'when piped through', stream,
        'to yield objects satisfying', 'to have length', 0)
        .then(() => item.emit('changed', changeData))
        .then(() => {
          expect(listener, 'was called once');
          expect(listener.lastCall, 'to satisfy', [{
            nodeId,
            value: changeData.value,
            referenceDescription: { nodeId },
            mtime: changeData.serverTimestamp,
          }]);
        });
    });
  });

  /** @test {SubscribeStream#_transform} */
  describe('#_transform', function() {
    const chunk = 'chunk';

    it('should call enqueue immediately if subscription started', function(done) {
      const stream = new SubscribeStream();
      stub(stream, '_enqueueChunk').callsFake(() => {});
      stream.once('subscription-started', subscription => {
        expect(stream.subscription, 'to be', subscription);

        stream._transform(chunk, 'utf8', () => {});

        expect(stream._enqueueChunk, 'was called once');
        expect(stream._enqueueChunk.lastCall, 'to satisfy', [chunk]);
        done();
      });
    });

    it('should wait for subscription to start before calling enqueue', function(done) {
      const stream = new SubscribeStream();
      stub(stream, '_enqueueChunk').callsFake(() => {});
      stream._transform(chunk, 'utf8', () => {});

      expect(stream._enqueueChunk, 'was not called');
      stream.once('subscription-started', () => {
        expect(stream._enqueueChunk, 'was called once');
        expect(stream._enqueueChunk.lastCall, 'to satisfy', [chunk]);
        done();
      });
    });
  });
});

/** @test {Watcher} */
describe('Watcher', function() {
  /** @test {Watcher#constructor} */
  describe('#constructor', function() {
    it('should work without arguments', function() {
      let watcher;
      expect(() => (watcher = new StubWatcher()),
        'not to throw');

      watcher.close();
    });

    it('should emit ready event once subscribe stream finished', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.once('ready', () => {
        watcher.close();
        done();
      });
    });

    it('should forward change events', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.on('ready', () => {
        const event = {};

        watcher.on('change', e => {
          expect(e, 'to be', event);
          watcher.close();
          done();
        });

        watcher._subscribeStream.emit('change', event);
      });
    });

    it('should forward NodeStream errors', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.on('error', err => {
        expect(err, 'to have message', 'Test');
        done();
      });

      watcher.on('ready', () => watcher._nodeStream.emit('error', new Error('Test')));
    });

    it('should forward SubscribeStream errors', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.on('error', err => {
        expect(err, 'to have message', 'Test');
        done();
      });

      watcher.on('ready', () => watcher._subscribeStream.emit('error', new Error('Test')));
    });
  });

  /** @test {Watcher#close} */
  describe('#close', function() {
    it('should forward errors', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.on('error', err => {
        expect(err, 'to have message', 'session is required');
        done();
      });

      watcher.on('ready', () => {
        watcher._subscribeStream.session = {};

        watcher.close();
      });
    });
  });
});
