import { Stream } from 'stream';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { resolveNodeId, DataType } from 'node-opcua';
import { obj as createTransformSteam } from 'through2';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';

const StubTransformer = {
  applyTransformers: spy(stream => stream),
};

const PullStream = proxyquire('../../../../src/lib/gulp/PullStream', {
  gulp: {
    dest: () => createTransformSteam((file, enc, callback) => {
      setTimeout(() => callback(null, file), 1100);
    }),
  },
  '../transform/Transformer': {
    _esModule: true,
    default: StubTransformer,
  },
}).default;

/** @test {PullStream} */
describe('PullStream', function() {
  /** @test {PullStream#constructor} */
  describe('#constructor', function() {
    beforeEach(() => StubTransformer.applyTransformers.reset());

    it('should return a stream', function() {
      expect(new PullStream(createTransformSteam()), 'to be a', Stream);
    });

    it('should apply transformers from db', function(done) {
      const readStream = createTransformSteam();
      const stream = new PullStream(readStream);
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      readStream.write({
        nodeId,
        referenceDescription: {
          typeDefinition: resolveNodeId('ns=0;i=62'),
          dataType: DataType.Boolean,
          nodeId,
        },
      });
      readStream.end();

      stream.on('end', () => {
        expect(StubTransformer.applyTransformers.calledOnce, 'to be', true);
        expect(StubTransformer.applyTransformers.lastCall.args[2],
          'to be', TransformDirection.FromDB);
        done();
      });
    });
  });
});
