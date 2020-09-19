import { Stream, PassThrough } from 'stream';
import Logger from 'gulplog';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { DataType, StatusCodes, Variant, NodeClass } from 'node-opcua';
import { obj as createTransformSteam } from 'through2';
import expect from '../../../expect';
import ReadStream from '../../../../src/lib/server/NodeStream';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';
import { ServerNode } from '../../../../src/lib/model/Node';

const StubTransformer = {
  applyTransformers: spy((stream) => stream),
};

const readline = {
  clearLine: spy().named('readline.clearLine'),
  moveCursor: spy().named('readline.moveCursor'),
};

const PullStream = proxyquire('../../../../src/lib/gulp/PullStream', {
  readline,
  './dest': {
    default: () => createTransformSteam(),
  },
  '../transform/Transformer': {
    _esModule: true,
    default: StubTransformer,
  },
}).default;

class StubReadStream extends ReadStream {
  processChunk(
    {
      nodeId,
      references = {},
      dataType = DataType.XmlElement,
      value = '<svg></svg>',
      nodeClass = NodeClass.Variable,
    },
    handleErrors
  ) {
    handleErrors(null, StatusCodes.Good, (done) => {
      this.push({
        nodeId,
        value: new Variant({
          dataType,
          value,
        }),
        nodeClass,
        references,
        mtime: new Date(),
      });
      done();
    });
  }
}

/** @test {PullStream} */
describe('PullStream', function () {
  /** @test {PullStream#constructor} */
  describe('#constructor', function () {
    let logListener;

    beforeEach(() => {
      StubTransformer.applyTransformers.resetHistory();
      readline.clearLine.resetHistory();
      readline.moveCursor.resetHistory();

      if (logListener) {
        Logger.removeListener('info', logListener);
      }
    });

    it('should return a stream', function () {
      const stream = new PullStream(new PassThrough({ objectMode: true }));
      expect(stream, 'to be a', Stream);
      stream.end();

      expect(stream, 'to yield objects satisfying', 'to have length', 0);
    });

    it('should apply transformers from db', function () {
      const readStream = new PassThrough({ objectMode: true });
      const stream = new PullStream(readStream);

      readStream.write(
        new ServerNode({
          name: 'Main',
          parent: null,
          nodeClass: NodeClass.Variable,
        })
      );
      readStream.end();

      return expect(stream, 'to yield objects satisfying', [expect.it('to be a', ServerNode)]).then(
        () => {
          expect(StubTransformer.applyTransformers.calledOnce, 'to be', true);
          expect(
            StubTransformer.applyTransformers.lastCall.args[2],
            'to be',
            TransformDirection.FromDB
          );
        }
      );
    });

    it.skip('should print progress', function () {
      const stream = new PullStream(Object.assign(new StubReadStream(), { _processed: 12 }));

      setTimeout(() => stream.end(), 1200);

      logListener = spy().named('logListener');
      Logger.on('info', logListener);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0).then(() => {
        // expect(logListener, 'was called once');
        expect(logListener.lastCall, 'to satisfy', [/Pulled: 12 \([0-9.]+ ops\/s\)/]);
        expect(readline.clearLine, 'was called once');
        expect(readline.moveCursor, 'was called once');
      });
    });

    it.skip('should work without log listeners', function () {
      const stream = new PullStream(new StubReadStream());

      setTimeout(() => stream.end(), 1200);

      return expect(stream, 'to yield objects satisfying', 'to have length', 0).then(() => {
        expect(readline.clearLine, 'was not called');
        expect(readline.moveCursor, 'was not called');
      });
    });
  });
});
