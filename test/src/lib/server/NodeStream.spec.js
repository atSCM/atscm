import { resolveNodeId, StatusCodes, NodeClass, ReferenceTypeIds } from 'node-opcua';
import { spy } from 'sinon';
import Logger from 'gulplog';
import expect from '../../../expect';
import { waitForEvent } from '../../../helpers/Emitter';
import NodeStream from '../../../../src/lib/server/NodeStream';
import NodeId from '../../../../src/lib/model/opcua/NodeId';

class StubNodeStream extends NodeStream {

  _transform(chunk, enc, callback) {
    callback(null, chunk);
  }

}

class NonRecursive extends NodeStream {

  processChunk(chunk, handleErrors) {
    setImmediate(() => {
      handleErrors(null, StatusCodes.Good, done => {
        this.push(chunk);
        done();
      });
    });
  }

}

/** @test {NodeStream} */
describe('NodeStream', function() {
  const testNodes = [
    new NodeId('ns=1;s=AGENT.DISPLAYS'),
    new NodeId('ns=1;s=AGENT.OBJECTS'),
  ];

  function referenceTypeId(referenceType) {
    return new NodeId(NodeId.NodeIdType.NUMERIC, referenceType);
  }

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
      expect((new StubNodeStream(testNodes, {
        ignoreNodes: [new NodeId('Test.Node')],
      })).ignoredRegExp, 'to equal', /^(ns=1;s=Test.Node)/);
    });

    it('should warn on ignored nodes', function(done) {
      Logger.once('warn', message => {
        expect(message, 'to match', /ignored/);
        done();
      });

      expect(new StubNodeStream(testNodes, {
        ignoreNodes: [testNodes[0]],
      }), 'to be defined');
    });

    it('should error without nodes to browse', function() {
      expect(() => new StubNodeStream(testNodes, { ignoreNodes: testNodes }),
        'to throw error', /Nothing to browse/);
    });

    /* it('should listen to drained events', function() {
      expect((new StubNodeStream(testNodes)).listenerCount('drained'), 'to equal', 1);
    }); */
  });

  /* @test {NodeStream#_writeNodesToBrowse} */
  describe('#_writeNodesToBrowse', function() {
    it('should forward read errors', function() {
      const stream = new StubNodeStream(testNodes);

      stream.prependOnceListener('session-open', () => {
        stream.session.read = (_, cb) => cb(new Error('Read error'));
      });

      return expect(stream, 'to error with', 'Read error');
    });

    it('should error on bad status code', function() {
      const node = new NodeId('Does.Not.Exist');
      const stream = new StubNodeStream([
        testNodes[0],
        node,
        testNodes[1],
      ]);

      return expect(stream, 'to error with', new RegExp(`^Error reading ${node}`));
    });

    it('should write read results', async function() {
      const stream = new NonRecursive(testNodes);

      spy(stream, 'write');

      await expect(stream, 'to yield objects satisfying', 'to have length', 2);

      return expect(stream.write, 'was called times', 2);
    });

    it('should call #end on drained', async function() {
      const stream = new NonRecursive(testNodes);

      spy(stream, 'end');

      await waitForEvent(stream, 'initial-read-complete');
      await waitForEvent(stream, 'drained');

      return expect(stream.end, 'was called once');
    });
  });

  /** @test {NodeStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');
    expect(NodeStream.prototype.processErrorMessage(nodeId),
      'to contain', nodeId.toString());
  });

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
                {
                  referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent), // anything valid
                  $nodeClass: NodeClass.Variable,
                  nodeId: new NodeId('ns=1;s=AGENT'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', testNodes.length);
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
                {
                  referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                  $nodeClass: NodeClass.Variable,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', testNodes.length);
    });

    it('should push nodes to browse', async function() {
      const stream = new NodeStream(testNodes, { recursive: false });

      return expect(stream, 'to yield objects satisfying',
        'to have items satisfying', (item, i) => {
          expect(item, 'to have property', 'nodeId', testNodes[i]);
          expect(item, 'to have property', 'nodeClass', NodeClass.Object);
        });
    });

    it('should browse discovered nodes', async function() {
      const stream = new NodeStream([testNodes[0]])
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                {
                  referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                  $nodeClass: NodeClass.Object,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.MAIN'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 2);
    });

    it('should push discovered object nodes', function() {
      const stream = new NodeStream(testNodes)
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                {
                  referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                  $nodeClass: NodeClass.Object,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.MAIN'),
                },
              ],
            }]);
          };
        });

      return expect(stream, 'to yield objects satisfying', 'to have length', 3);
    });

    it('should push discovered variable nodes', async function() {
      const stream = new NodeStream(testNodes)
        .prependOnceListener('session-open', () => {
          stream.session.browse = (options, callback) => {
            callback(null, [{
              statusCode: StatusCodes.Good,
              references: [
                {
                  referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                  $nodeClass: NodeClass.Variable,
                  nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                },
              ],
            }]);
          };
        });

      spy(stream, 'write');

      await expect(stream, 'to yield objects satisfying', 'to have length', 3);

      return expect(stream.write, 'was called times', 3);
    });

    it('should write discovered nodes if recursive', function() {
      let alreadyCalled = false;
      const stream = new NodeStream([testNodes[0]], { recursive: true })
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
                    referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                    $nodeClass: NodeClass.Variable,
                    nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
                  },
                  {
                    referenceTypeId: referenceTypeId(ReferenceTypeIds.HasComponent),
                    $nodeClass: NodeClass.Object,
                    nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.MAIN'),
                  },
                ],
              }]);
            }
          };
        });

      spy(stream, 'write');

      return expect(stream, 'to yield objects satisfying', 'to have length', 3)
        .then(() => expect(stream.write, 'was called times', 3));
    });
  });
});
