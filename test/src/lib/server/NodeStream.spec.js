import { StatusCodes, NodeClass } from 'node-opcua';
import { spy } from 'sinon';
import expect from '../../../expect';
import NodeStream from '../../../../src/transform/UaNodeToAtviseFileTransformer';
import NodeId from '../../../../src/lib/ua/NodeId';

class StubNodeStream extends NodeStream {

  _transform(chunk, enc, callback) {
    callback(null, chunk);
  }

}

/** @test {NodeStream} */
describe('NodeStream', function() {
  const testNodes = [new NodeId('ns=1;s=AGENT.DISPLAYS')];

  /** @test {NodeStream#constructor} */
  describe('#constructor', function() {
    it('should fail without nodesToBrowse', function() {
      expect(() => new NodeStream(), 'to throw', /nodesToBrowse is required/);
    });

    it('should throw with invalid ignoreNodes', function() {
      expect(() => new NodeStream(testNodes, { ignoreNodes: 'test' }),
        'to throw', /ignoreNodes must be an array/);
    });

    it('should store "recursive" option', function() {
      expect((new StubNodeStream(testNodes, { recursive: false })).recursive, 'to be', false);
    });

    it('should create ignoredRexExp', function() {
      expect((new StubNodeStream(testNodes, { ignoreNodes: testNodes })).ignoredRegExp,
        'to equal', /^(ns=1;s=AGENT.DISPLAYS)/);
    });

    it('should listen to drained events', function() {
      expect((new StubNodeStream(testNodes)).listenerCount('drained'), 'to equal', 1);
    });
  });

  /** @test {NodeStream#processErrorMessage} */
  /* describe('#processErrorMessage', function() {
    const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');
    expect(NodeStream.prototype.processErrorMessage(nodeId),
      'to contain', nodeId.toString());
  }); */

  /** @test {NodeStream#processChunk} */
  describe('#processChunk', function() {
    it('should forward browse errors', function() {
      const stream = new NodeStream(testNodes)
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(new Error('Browse error'));
          };
        });

      return expect(stream, 'to error with', /Browse error/);
    });

    it('should emit error without results', function() {
      const stream = new NodeStream(testNodes)
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, null);
          };
        });

      return expect(stream, 'to error with', /No results/);
    });

    it('should emit error with empty results', function() {
      const stream = new NodeStream(testNodes)
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, []);
          };
        });

      return expect(stream, 'to error with', /No results/);
    });

    it('should not push parent nodes', function() {
      const stream = new NodeStream(testNodes, { recursive: false })
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                { nodeId: new NodeId('ns=1;s=AGENT') },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should not push ignored nodes', function() {
      const stream = new NodeStream(testNodes, {
        recursive: false,
        ignoreNodes: [new NodeId('ns=1;s=AGENT.DISPLAYS.Main')],
      })
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                { nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main') },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should not push discovered object nodes', function() {
      const stream = new NodeStream(testNodes, { recursive: false })
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                {
                  nodeClass: NodeClass.Object,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should push discovered variable nodes', function() {
      const stream = new NodeStream(testNodes, { recursive: false })
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                {
                  nodeClass: NodeClass.Variable,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 1);
    });

    it('should write discovered nodes if recursive', function() {
      let alreadyCalled = false;
      const stream = new NodeStream(testNodes, { recursive: true })
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            if (alreadyCalled) {
              callback(null, [{
                statusCode: StatusCodes.Good,
                references: [],
              }]);
            } else {
              alreadyCalled = true;

              callback(null, [{
                statusCode: StatusCodes.Good,
                references: [
                  {
                    nodeClass: NodeClass.Variable,
                    nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                  },
                  {
                    nodeClass: NodeClass.Object,
                    nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.MAIN'),
                  },
                ],
              }]);
            }
          };
        });

      spy(stream, 'write');

      return expect(stream, 'to yield objects satisfying', 'to have length', 1)
        .then(() => expect(stream.write, 'was called times', 2));
    });
  });
});
