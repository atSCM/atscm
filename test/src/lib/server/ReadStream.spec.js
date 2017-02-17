import { spy, stub } from 'sinon';
import expect from '../../../expect';

import NodeId from '../../../../src/lib/server/NodeId';
import ReadStream from '../../../../src/lib/server/ReadStream';

/** @test {ReadStream} */
describe('ReadStream', function() {
  const validNodeId = new NodeId('ns=0;i=2262'); // ProductUri

  /** @test {ReadStream#readNode} */
  describe('#readNode', function() {
    it('should fail if an error occurs', function() {
      const stream = new ReadStream();

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(new Error('Failed'));
      });

      return expect([validNodeId], 'when piped through', stream,
        'to error with', `Reading ${validNodeId.toString()} failed: Failed`);
    });

    it('should with no or empty results', function() {
      const stream = new ReadStream();

      stream.once('session-open', () => {
        stream.session.read = (node, cb) => cb(null, []);
      });

      return expect([validNodeId], 'when piped through', stream,
        'to error with', `Reading ${validNodeId.toString()} failed: No results`);
    });

    it('should fail with non-good status code', function() {
      const stream = new ReadStream();
      const nodeId = new NodeId('ns=123;i=2262'); // This node does not exist

      return expect([nodeId], 'when piped through', stream,
        'to error with', /Reading ns=123;i=2262 failed: Status BadNodeIdUnknown/);
    });

    it('should read variables', function() {
      const stream = new ReadStream();

      return expect([validNodeId], 'when piped through', stream, 'to yield objects satisfying', [{
        nodeId: validNodeId,
        value: { value: 'http://www.atvise.com' },
      }]);
    });
  });

  /** @test {ReadStream#_transform} */
  describe('#_transform', function() {
    it('should wait for session to open', function(done) {
      const stream = new ReadStream();
      stub(stream, 'readNode', (node, cb) => cb(null));
      spy(stream, '_transform');

      stream.on('data', () => {}); // Unpause readable stream
      stream.write(new NodeId('ns=1;s=AGENT.DISPLAYS'));

      expect(stream._transform.calledOnce, 'to be', true);
      expect(stream.readNode.callCount, 'to equal', 0);

      stream.once('end', () => {
        expect(stream._transform.calledOnce, 'to be', true);
        expect(stream.readNode.calledOnce, 'to be', true);
        done();
      });
      stream.end();
    });

    it('should read immediate if session is open', function(done) {
      const stream = new ReadStream();
      stub(stream, 'readNode', (node, cb) => cb(null));

      stream.on('data', () => {}); // Unpause readable stream

      stream.once('session-open', () => {
        stream.write(new NodeId('ns=1;s=AGENT.DISPLAYS'));
        expect(stream.readNode.calledOnce, 'to be true');
        stream.end();
      });

      stream.on('end', done);
    });
  });
});
