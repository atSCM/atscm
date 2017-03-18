import { StatusCodes } from 'node-opcua';
import expect from '../../../expect';
import NodeId from '../../../../src/lib/server/NodeId';
import ReadStream from '../../../../src/lib/server/ReadStream';

/** @test {ReadStream} */
describe('ReadStream', function() {
  /** @test {ReadStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should include node id', function() {
      const nodeId = new NodeId('ns=1;s=AGENT.DISPLAYS.Main');
      expect(ReadStream.prototype.processErrorMessage({ nodeId }), 'to contain', nodeId.value);
    });
  });

  /** @test {ReadStream#processChunk} */
  describe('#processChunk', function() {
    it('should error without results', function() {
      const stream = new ReadStream();

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(null, [node], undefined);
      });

      return expect([{ nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /No results/);
    });

    it('should error with empty results', function() {
      const stream = new ReadStream();

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(null, [node], []);
      });

      return expect([{ nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /No results/);
    });

    it('should error when reading fails', function() {
      const stream = new ReadStream();

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(new Error('Test'), [node], []);
      });

      return expect([{ nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /Test/);
    });

    it('should push result when reading succeeds', function() {
      const stream = new ReadStream();
      const result = {
        value: 'test',
        sourceTimestamp: new Date(),
        statusCode: StatusCodes.Good,
      };

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(null, [node], [result]);
      });

      const nodeId = new NodeId('ns=1;s=AGENT.DISPLAYS.Main');
      return expect([{ nodeId }],
        'when piped through', stream,
        'to yield objects satisfying', [
          expect.it('to equal', {
            nodeId,
            value: result.value,
            referenceDescription: { nodeId },
            mtime: result.sourceTimestamp,
          }),
        ]);
    });
  });
});
