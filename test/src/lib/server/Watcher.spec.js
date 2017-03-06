import Emitter from 'events';
import { Stream } from 'stream';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import expect from 'unexpected';
import { ClientSubscription, resolveNodeId } from 'node-opcua';
import { ctor as throughStreamClass } from 'through2';
import Watcher from '../../../../src/lib/server/Watcher';

class StubMonitoredItem extends Emitter {

  constructor(error = false) {
    super();

    // Simulate first notification or error
    setTimeout(() => this.emit(error ? 'err' : 'changed', error || {}), 10);
  }

}

const stubSession = {};
const SubscribeStream = proxyquire('../../../../src/lib/server/Watcher', {
  'node-opcua': {
    ClientSubscription: class StubClientSubscription extends Emitter {
      constructor() {
        super();

        this.monitor = spy(() => new StubMonitoredItem());

        setTimeout(() => this.emit('started', {}), 10);
      }
    },
  },
  './Stream': {
    _esModule: true,
    default: class ServerStream extends throughStreamClass({ objectMode: true }) {
      constructor() {
        super();

        setTimeout(() => this.emit('session-open', stubSession), 10);
      }
    },
  },
}).SubscribeStream;

/** @test {SubscribeStream} */
describe('SubscribeStream', function() {
  /** @test {SubscribeStream#constructor} */
  describe('#constructor', function() {
    it('should return a stream', function() {
      expect(new SubscribeStream(), 'to be a', Stream);
    });
  });

  /** @test {SubscribeStream#createSubscription} */
  describe('#createSubscription', function() {
    it('should be called once session is open', function() {
      const stream = new SubscribeStream();
      stream.createSubscription = spy();
      stream.once('session-open', () => {
        expect(stream.createSubscription.calledOnce, 'to be true');
      });
    });

    it('should emit `subscription-started` event', function(done) {
      const stream = new SubscribeStream();
      stream.once('subscription-started', subscription => {
        expect(subscription.constructor.name, 'to equal', 'StubClientSubscription');
        done();
      });
    });
  });

  /** @test {SubscribeStream#monitorNode} */
  describe('#monitorNode', function() {
    it('should call node-opcua~ClientSubscription#monitor', function(done) {
      const stream = new SubscribeStream();
      stream.once('subscription-started', () => {
        stream.monitorNode({
          nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main'),
        }, err => {
          expect(err, 'to be falsy');
          expect(stream.subscription.monitor.calledOnce, 'to be true');
          done();
        });
      });
    });

    it('should ignore first change event', function(done) {
      const stream = new SubscribeStream();
      stream.once('subscription-started', () => {
        const changeListener = spy();
        stream.on('changed', changeListener);

        stream.monitorNode({
          nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main'),
        }, err => {
          expect(err, 'to be falsy');
          expect(changeListener.callCount, 'to equal', 0);
          done();
        });
      });
    });

    it('should forward change events when tracking changes', function(done) {
      const stream = new SubscribeStream();
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      stream.once('subscription-started', () => {
        const item = stream.monitorNode({
          nodeId
        }, function(err) {
          expect(err, 'to be falsy');

          setTimeout(() => item.emit('changed', {
            value: { value: 13 },
            serverTimestamp: new Date() }
            ),
            10);
          stream.end();
        });
      })
        .on('change', e => {
          expect(e.nodeId, 'to equal', nodeId);
          expect(e.referenceDescription.nodeId, 'to equal', nodeId);
          expect(e.value.value, 'to equal', 13);

          done();
        });
    });

    it('should forward errors', function(done) {
      const stream = new SubscribeStream();
      stream.once('subscription-started', () => {
        stream.subscription.monitor = spy(() => new StubMonitoredItem(new Error('Test')));

        stream.monitorNode({
          nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main'),
        }, err => {
          expect(err, 'to have message', 'Error monitoring ns=1;s=AGENT.DISPLAYS.Main: Test');

          done();
        });
      });
    });
  });

  /** @test {SubscribeStream#_transform} */
  describe('#_transform', function() {
    const desc = { nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') };

    it('should should wait for subscription to start', function(done) {
      const stream = new SubscribeStream();
      spy(stream, 'monitorNode');

      stream.write(desc);
      expect(stream.monitorNode.callCount, 'to equal', 0);

      stream.once('subscription-started', () => {
        expect(stream.monitorNode.calledOnce, 'to be', true);
        done();
      });
    });

    it('should call #monitorNode immediately if subscription started', function(done) {
      const stream = new SubscribeStream();
      spy(stream, 'monitorNode');

      stream.once('subscription-started', () => {
        stream.write(desc);
        expect(stream.monitorNode.calledOnce, 'to be', true);

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
      expect(() => (watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')])),
        'not to throw');

      watcher.on('ready', () => watcher.close());
    });

    it('should emit ready event once subscribe stream finished', function(done) {
      const watcher = new Watcher([resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main')]);

      watcher.on('ready', () => {
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
  });
});
