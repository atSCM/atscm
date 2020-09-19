import Emitter from 'events';
import { spy } from 'sinon';
import expect from '../../../expect';
import WaitingStream, { waitForDependencies } from '../../../../src/lib/server/WaitingStream';
import QueueStream from '../../../../src/lib/server/QueueStream';
import NodeId from '../../../../src/lib/model/opcua/NodeId';

class StubStream extends Emitter {
  constructor() {
    super();

    this.spies = {
      _enqueueChunk: spy(),
      _flush: spy(),
    };
  }

  _enqueueChunk(...args) {
    this.spies._enqueueChunk(...args);
    this.emit('processed-chunk', ...args);
  }

  _flush(callback) {
    this.spies._flush(callback);

    callback(null);
  }
}

class NoDeps extends waitForDependencies(StubStream) {
  dependenciesFor() {
    return [];
  }
}

class WithDeps extends waitForDependencies(StubStream) {
  constructor(deps = [new NodeId('Testing')]) {
    super();
    this._deps = deps;
  }

  dependenciesFor() {
    const deps = this._deps;

    this._deps = [];

    return deps;
  }
}

/** @test {WaitingStream} */
describe('WaitingStream', function () {
  /** @test {WaitingStream#constructor} */
  describe('#constructor', function () {
    it('should return a QueueStream, mixed with waitForDependencies', function () {
      const stream = new WaitingStream();

      expect(stream, 'to be a', QueueStream);
      expect(stream.dependenciesFor, 'to be defined');
    });
  });

  /** @test {WaitingStream#dependenciesFor} */
  describe('#dependenciesFor', function () {
    it('should throw if not overridden', function () {
      return expect(WaitingStream.prototype.dependenciesFor, 'to throw', /must be implemented/);
    });
  });

  /** @test {WaitingStream#_enqueueChunk} */
  describe('#_enqueueChunk', function () {
    context('when a dependency-free file is pushed', function () {
      it('should just call super', function () {
        const stream = new NoDeps();
        stream._enqueueChunk({ nodeId: new NodeId('chunk') });

        return expect(stream.spies._enqueueChunk, 'was called once');
      });
    });

    context('when a file with dependencies is pushed', function () {
      it('should not call super', function () {
        const stream = new WithDeps();
        stream._enqueueChunk({ nodeId: new NodeId('Source') });

        return expect(stream.spies._enqueueChunk, 'was not called');
      });

      it('should add it to the dependencies map', function () {
        const stream = new WithDeps();
        const chunk = { nodeId: new NodeId('Source') };
        stream._enqueueChunk(chunk);

        expect(stream._waitingFor['ns=1;s=Testing'], 'to be defined');
        expect(stream._waitingFor['ns=1;s=Testing'], 'to have an item satisfying', 'to be', chunk);
      });

      it('should ignore system types', function () {
        const stream = new WithDeps([new NodeId(NodeId.NodeIdType.STRING, 'System', 0)]);
        stream._enqueueChunk({ nodeId: new NodeId('Source') });

        expect(stream._waitingFor['ns=1;s=Testing'], 'to be undefined');
        return expect(stream.spies._enqueueChunk, 'was called');
      });

      it('should ignore atserver types', function () {
        const stream = new WithDeps([new NodeId('VariableTypes.ATVISE.Display')]);
        stream._enqueueChunk({ nodeId: new NodeId('Source') });

        expect(stream._waitingFor['ns=1;s=Testing'], 'to be undefined');
        return expect(stream.spies._enqueueChunk, 'was called');
      });

      it('should ignore already processed nodes', function () {
        const dep = new NodeId('TestDep');
        const stream = new WithDeps([dep]);
        stream._finishedProcessing[dep.toString()] = true;
        stream._enqueueChunk({ nodeId: new NodeId('Source') });

        expect(stream._waitingFor['ns=1;s=Testing'], 'to be undefined');
        return expect(stream.spies._enqueueChunk, 'was called');
      });

      it('should process files once dependencies are finished', function (done) {
        const dep = new NodeId('TestDep');
        const dep2 = new NodeId('TestDep2');
        const source = new NodeId('Source');
        const stream = new WithDeps([dep, dep2]);

        stream._enqueueChunk({ nodeId: source });
        expect(stream.spies._enqueueChunk, 'was not called');

        stream._enqueueChunk({ nodeId: dep });
        expect(stream.spies._enqueueChunk, 'was called once');

        stream.once('processed-chunk', async ({ nodeId }) => {
          try {
            await expect(nodeId, 'to be', source);
            await expect(stream.spies._enqueueChunk, 'to have calls satisfying', [
              { args: [{ nodeId: dep }] },
              { args: [{ nodeId: dep2 }] },
              { args: [{ nodeId: source }] },
            ]);
            done();
          } catch (e) {
            done(e);
          }
        });

        stream._enqueueChunk({ nodeId: dep2 });
      });
    });
  });

  /** @test {WaitingStream#_flush} */
  describe('#_flush', function () {
    context('without pending operations', function () {
      it('should call super', function () {
        const stream = new NoDeps();
        stream._flush(() => {});
        return expect(stream.spies._flush, 'was called once');
      });
    });

    context('with pending operations', function () {
      it('should try to process dependents', function () {
        const stream = new WithDeps([new NodeId('Dep')]);
        stream._enqueueChunk({ nodeId: new NodeId('Depending') });

        return expect((cb) => stream._flush(cb), 'to call the callback without error');
      });
    });
  });
});
