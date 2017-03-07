import { Stream } from 'stream';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { src } from 'gulp';
import { obj as createTransformStream } from 'through2';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';

const StubTransformer = {
  applyTransformers: spy(stream => stream
    .pipe(createTransformStream((file, enc, cb) => {
      setTimeout(() => cb(null, file), 1100);
    }))
  ),
};

const PushStream = proxyquire('../../../../src/lib/gulp/PushStream', {
  '../server/WriteStream': {
    _esModule: true,
    default: class WriteStream {
      constructor() {
        return createTransformStream();
      }
    },
  },
  '../transform/Transformer': {
    _esModule: true,
    default: StubTransformer,
  },
}).default;

/** @test {PushStream} */
describe('PushStream', function() {
  /** @test {PushStream#constructor} */
  describe('#constructor', function() {
    beforeEach(() => StubTransformer.applyTransformers.reset());

    it('should return a stream', function() {
      expect(new PushStream(createTransformStream()), 'to be a', Stream);
    });

    it('should apply transforms from filesystem', function(done) {
      const srcStream = src('./src/index.js');
      const stream = new PushStream(srcStream);

      stream.on('end', () => {
        expect(StubTransformer.applyTransformers.calledOnce, 'to be', true);
        expect(StubTransformer.applyTransformers.lastCall.args[2],
          'to be', TransformDirection.FromFilesystem);
        done();
      });
    });
  });
});
