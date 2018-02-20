import { Stream } from 'stream';
import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { ctor as throughStreamClass } from 'through2';
import { NodeClass } from 'node-opcua';
import NodeId from '../../../src/lib/model/opcua/NodeId';

const pull = proxyquire('../../../src/tasks/pull', {
  '../lib/server/NodeStream': {
    _esModule: true,
    default: class StubStream extends throughStreamClass({ objectMode: true }) {

      constructor() {
        super();

        this.push({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
          typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
          nodeClass: NodeClass.Variable,
        });

        this.end();
      }

    },
  },
  '../lib/gulp/PullStream': {
    _esModule: true,
    default: class PStream {

      constructor(readStream) {
        return readStream;
      }

    },
  },
}).default;

/** @test {pull} */
describe('pull', function() {
  it('should return a stream', function(done) {
    const stream = pull();

    expect(stream, 'to be a', Stream);

    stream.on('data', () => {}); // Unpipe readable stream
    stream.once('end', done);
  });
});
