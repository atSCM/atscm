import { StatusCodes, NodeClass } from 'node-opcua';
import Logger from 'gulplog';
import { spy } from 'sinon';
import expect from '../../../expect';
import NodeId from '../../../../src/lib/model/opcua/NodeId';
import ReadStream from '../../../../src/lib/server/ReadStream';

/** @test {ReadStream} */
describe('ReadStream', function() {
  function browseResult(nodeId, nodeClass = NodeClass.Variable) {
    const id = nodeId instanceof NodeId ? nodeId : new NodeId(nodeId);

    return {
      nodeId: id,
      nodeClass,
      references: {},
    };
  }
  /** @test {ReadStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should include node id', function() {
      const nodeId = new NodeId('ns=1;s=AGENT.DISPLAYS.Main');
      expect(ReadStream.prototype.processErrorMessage({ nodeId }), 'to contain', nodeId.value);
    });
  });

  /** @test {ReadStream#processChunk} */
  describe('#processChunk', function() {
    context('when a variable node is passed', function() {
      it('should error without results', function() {
        const stream = new ReadStream();

        stream.once('session-open', () => {
          stream.session.read = (node, cb) => cb(null, [node], undefined);
        });

        return expect([browseResult('ns=1;s=AGENT.DISPLAYS.Main')],
          'when piped through', stream,
          'to error with', /No results/);
      });

      it('should error with empty results', function() {
        const stream = new ReadStream();

        stream.once('session-open', () => {
          stream.session.read = (node, cb) => cb(null, [node], []);
        });

        return expect([browseResult('ns=1;s=AGENT.DISPLAYS.Main')],
          'when piped through', stream,
          'to error with', /No results/);
      });

      it('should error when reading fails', function() {
        const stream = new ReadStream();

        stream.once('session-open', () => {
          stream.session.read = (node, cb) => cb(new Error('Test'), [node], []);
        });

        return expect([browseResult('ns=1;s=AGENT.DISPLAYS.Main')],
          'when piped through', stream,
          'to error with', /Test/);
      });

      it('should warn if datasource is not connected', async function() {
        const stream = new ReadStream();

        spy(Logger, 'warn');

        stream.once('session-open', () => {
          stream.session.read = (node, cb) => cb(null, [{}], [{
            statusCode: StatusCodes.BadServerNotConnected,
          }], []);
        });

        await expect([browseResult('ns=1;s=AGENT.DISPLAYS.Main')],
          'when piped through', stream,
          'to yield objects satisfying', 'to have length', 0);

        expect(Logger.warn, 'was called once');

        return expect(Logger.warn, 'was called with',
          expect.it('to match', /datasource.*not connected/));
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
        const browsed = browseResult(nodeId);
        return expect([browsed],
          'when piped through', stream,
          'to yield objects satisfying', [
            expect.it('to equal', Object.assign({}, browsed, {
              value: result.value,
              mtime: result.sourceTimestamp,
            })),
          ]);
      });
    });

    context('when a non-variable node is passed', function() {
      it('should push the original browse result', function() {
        const stream = new ReadStream();

        const browsed = browseResult('AGENT.DISPLAYS', NodeClass.Object);

        return expect([browsed],
          'when piped through', stream,
          'to yield objects satisfying', [
            expect.it('to equal', browsed),
          ]);
      });
    });
  });
});
