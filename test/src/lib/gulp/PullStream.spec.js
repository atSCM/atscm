import { Stream } from 'stream';
import Logger from 'gulplog';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { resolveNodeId, DataType, StatusCodes, Variant } from 'node-opcua';
import { obj as createTransformSteam } from 'through2';
import expect from '../../../expect';
import ReadStream from '../../../../src/lib/pull/ReadStream';
import AtviseFile from '../../../../src/lib/mapping/AtviseFile';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';

const StubTransformer = {
  applyTransformers: spy(stream => stream),
};

const readline = {
  clearLine: spy().named('readline.clearLine'),
  moveCursor: spy().named('readline.moveCursor'),
};

const PullStream = proxyquire('../../../../src/lib/gulp/PullStream', {
  readline,
  gulp: {
    dest: () => createTransformSteam(),
  },
  '../transform/Transformer': {
    _esModule: true,
    default: StubTransformer,
  },
}).default;

class StubReadStream extends ReadStream {

  processChunk(referenceDescription, handleErrors) {
    handleErrors(null, StatusCodes.Good, done => {
      this.push({
        nodeId: referenceDescription.nodeId,
        value: new Variant({
          dataType: DataType.XmlElement,
          value: '<svg></svg>',
        }),
        referenceDescription,
        mtime: new Date(),
      });
      done();
    });
  }

}

/** @test {PullStream} */
describe('PullStream', function() {
  /** @test {PullStream#constructor} */
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
      const stream = new PullStream(new StubReadStream());
      expect(stream, 'to be a', Stream);
      stream.end();

      expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should apply transformers from db', function() {
      const readStream = new StubReadStream();
      const stream = new PullStream(readStream);
      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      readStream.write({
        typeDefinition: resolveNodeId('ns=0;i=62'),
        dataType: DataType.Boolean,
        nodeId,
      });
      readStream.end();

      return expect(stream, 'to yield objects satisfying', [
        expect.it('to be a', AtviseFile),
      ])
        .then(() => {
          expect(StubTransformer.applyTransformers.calledOnce, 'to be', true);
          expect(StubTransformer.applyTransformers.lastCall.args[2],
            'to be', TransformDirection.FromDB);
        });
    });

    it('should print progress', function() {
      const stream = new PullStream(Object.assign(new StubReadStream(), { _processed: 12 }));

      setTimeout(() => stream.end(), 1200);

      logListener = spy().named('logListener');
      Logger.on('info', logListener);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(logListener, 'was called once');
          expect(logListener.lastCall, 'to satisfy', [/Pulled: 12 \([0-9.]+ ops\/s\)/]);
          expect(readline.clearLine, 'was called once');
          expect(readline.moveCursor, 'was called once');
        });
    });

    it('should work without log listeners', function() {
      const stream = new PullStream(new StubReadStream());

      setTimeout(() => stream.end(), 1200);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0)
        .then(() => {
          expect(readline.clearLine, 'was not called');
          expect(readline.moveCursor, 'was not called');
        });
    });
  });
});
