import { Stream } from 'stream';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { obj as createTransformStream } from 'through2';
import File from 'vinyl';
import Logger from 'gulplog';
import expect from '../../../expect';
import AtviseFile from '../../../../src/lib/mapping/AtviseFile';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';

const StubTransformer = {
  applyTransformers: spy(stream => stream),
};

const readline = {
  clearLine: spy().named('readline.clearLine'),
  moveCursor: spy().named('readline.moveCursor'),
};

const PushStream = proxyquire('../../../../src/lib/gulp/PushStream', {
  readline,
  '../server/WriteStream': {
    _esModule: true,
    default: class WriteStream {

      constructor() {
        return Object.assign(createTransformStream(), {
          opsPerSecond: 13.2,
          _processed: 12,
        });
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
    let logListener;

    beforeEach(() => {
      StubTransformer.applyTransformers.resetHistory();
      readline.clearLine.resetHistory();
      readline.moveCursor.resetHistory();

      if (logListener) {
        Logger.removeListener('info', logListener);
      }
    });

    it('should return a stream', function() {
      const stream = new PushStream(createTransformStream());
      expect(stream, 'to be a', Stream);
      stream.end();

      return expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should apply transformers from db', function() {
      const srcStream = createTransformStream();
      const stream = new PushStream(srcStream);

      srcStream.write(new File({
        path: 'src/AGENT/DISPLAYS/Main',
        base: 'src',
      }));
      srcStream.end();

      return expect(stream, 'to yield objects satisfying', [
        expect.it('to be a', AtviseFile),
      ])
        .then(() => {
          expect(StubTransformer.applyTransformers.calledOnce, 'to be', true);
          expect(StubTransformer.applyTransformers.lastCall.args[2],
            'to be', TransformDirection.FromFilesystem);
        });
    });

    it('should print progress', function() {
      const stream = new PushStream(createTransformStream());

      setTimeout(() => stream.end(), 1200);

      logListener = spy().named('logListener');
      Logger.on('info', logListener);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(logListener, 'was called once');
          expect(logListener.lastCall, 'to satisfy', [/Pushed: 12 \([0-9.]+ ops\/s\)/]);
          expect(readline.clearLine, 'was called once');
          expect(readline.moveCursor, 'was called once');
        });
    });

    it('should work without log listeners', function() {
      const stream = new PushStream(createTransformStream());

      setTimeout(() => stream.end(), 1200);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(readline.clearLine, 'was not called');
          expect(readline.moveCursor, 'was not called');
        });
    });
  });
});
