import expect from 'unexpected';
import proxyquire from 'proxyquire';

import { Stream } from 'stream';
import through, { ctor as throughStreamClass } from 'through2';
import NodeId from '../../../src/lib/server/NodeId';
import AtviseFile from '../../../src/lib/server/AtviseFile';

const pull = proxyquire('../../../src/tasks/pull', {
  '../lib/server/NodeStream': {
    _esModule: true,
    default: class StubStream extends throughStreamClass({ objectMode: true }) {
      constructor() {
        super();

        this.push({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
          typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
        });

        this.end();
      }
    },
  },
  gulp: {
    _esModule: true,
    dest: () => through.obj(),
  },
}).default;

/** @test {pull} */
describe('pull', function() {
  this.timeout(5000);

  it('should return a stream', function(done) {
    const stream = pull();

    expect(stream, 'to be a', Stream);
    stream.once('end', done);
  });

  it('should stream AtviseFiles', function(done) {
    const stream = pull();

    stream.on('data', data => {
      expect(data, 'to be a', AtviseFile);
    });

    stream.once('end', done);
  });
});
