import { StatusCodes } from 'node-opcua';
import Logger from 'gulplog';
import expect from '../../../expect';
import TreeStream from '../../../../src/lib/server/TreeStream';
import NodeId from '../../../../src/lib/model/opcua/NodeId';

class StubImplementation extends TreeStream {

  constructor(...args) {
    super(...args);

    this._chunks = [];
  }

  processErrorMessage({ nodeId }) {
    return `Stub failed for ${nodeId.value}`;
  }

  processChunk(file, handleErrors) {
    this._chunks.push({ file, handleErrors });
  }

  finishOne(error = null, statusCode = StatusCodes.Good) {
    const { file, handleErrors } = this._chunks.shift();

    if (!error && statusCode === StatusCodes.Good) {
      this.push(file);
    }

    handleErrors(error, statusCode, done => done());
  }

}

/** @test {TreeStream} */
describe('TreeStream', function() {
  before('prevent exit on error log', () => {
    Logger.on('error', console.error);
  });

  after(() => {
    Logger.removeListener('error', console.error);
  });

  /** @test {TreeStream#constructor} */
  describe('#constructor', function() {
    it('should install an additional processed-chunk listener', function() {
      const stream = new TreeStream();

      return expect(stream.listenerCount('processed-chunk'), 'to be', 2);
    });
  });

  /** @test {TreeStream#_enqueueChunk} */
  describe('#_enqueueChunk', function() {
    it('should enqueue unrelated chunks as usual', function() {
      const stub = new StubImplementation();

      const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS') };

      const promise = expect([chunk],
        'when piped through', stub,
        'to yield chunks satisfying', [expect.it('to be', chunk)]);

      stub.once('session-open', () => {
        stub.finishOne();
      });

      return promise;
    });

    context('when a child node is written', function() {
      it('should await the parent to be processed', function() {
        const stub = new StubImplementation();
        const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') };
        const parent = { nodeId: chunk.nodeId.parent };

        const promise = expect([parent, chunk],
          'when piped through', stub,
          'to yield chunks satisfying', [
            expect.it('to be', parent),
            expect.it('to be', chunk),
          ]);

        stub.once('session-open', () => {
          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', parent);
          stub.finishOne();

          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', chunk);
          stub.finishOne();
        });

        return promise;
      });

      it('should allow multiple children to wait for the parent', function() {
        const stub = new StubImplementation();
        const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') };
        const another = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Default') };
        const parent = { nodeId: chunk.nodeId.parent };

        const promise = expect([parent, chunk, another],
          'when piped through', stub,
          'to yield chunks satisfying', [
            expect.it('to be', parent),
            expect.it('to be', chunk),
            expect.it('to be', another),
          ]);

        stub.once('session-open', () => {
          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', parent);
          stub.finishOne();

          expect(stub._chunks, 'to have length', 2);
          expect(stub._chunks[0].file, 'to be', chunk);
          stub.finishOne();

          expect(stub._chunks[0].file, 'to be', another);
          stub.finishOne();
        });

        return promise;
      });

      before(() => {
        process.env.CONTINUE_ON_FAILURE = 'true';
      });

      after(() => {
        process.env.CONTINUE_ON_FAILURE = 'false';
      });

      it('should not be processed if the parent fails with error', function() {
        const stub = new StubImplementation();
        const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') };
        const parent = { nodeId: chunk.nodeId.parent };

        const promise = expect([parent, chunk],
          'when piped through', stub,
          'to yield chunks satisfying', 'to have length', 0);

        stub.once('session-open', () => {
          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', parent);
          stub.finishOne(new Error('Test'));

          expect(stub._chunks, 'to have length', 0);
        });

        return promise;
      });

      it('should not be processed if the parent fails with bad status', function() {
        const stub = new StubImplementation();
        const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') };
        const parent = { nodeId: chunk.nodeId.parent };

        const promise = expect([parent, chunk],
          'when piped through', stub,
          'to yield chunks satisfying', 'to have length', 0);

        stub.once('session-open', () => {
          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', parent);
          stub.finishOne(null, StatusCodes.Bad);

          expect(stub._chunks, 'to have length', 0);
        });

        return promise;
      });

      it('should skip children\'s child nodes on failure', function() {
        const stub = new StubImplementation();
        const chunk = { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.MAIN.Any') };
        const parent = { nodeId: chunk.nodeId.parent };
        const rootNode = { nodeId: parent.nodeId.parent };

        const promise = expect([rootNode, parent, chunk],
          'when piped through', stub,
          'to yield chunks satisfying', 'to have length', 0);

        stub.once('session-open', () => {
          expect(stub._chunks, 'to have length', 1);
          expect(stub._chunks[0].file, 'to be', rootNode);
          stub.finishOne(new Error('Test'));

          expect(stub._chunks, 'to have length', 0);
        });

        return promise;
      });
    });
  });
});
