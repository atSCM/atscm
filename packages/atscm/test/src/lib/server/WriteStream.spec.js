import { spy } from 'sinon';
import { StatusCodes, NodeClass } from 'node-opcua';
import Logger from 'gulplog';
import expect from '../../../expect';
import _WriteStream from '../../../../src/lib/server/WriteStream';
import _CreateNodeStream from '../../../../src/lib/server/CreateNodeStream';
import AtviseFile from '../../../../src/lib/server/AtviseFile';
import NodeId from '../../../../src/lib/model/opcua/NodeId';

class CreateNodeStream extends _CreateNodeStream {
  processChunk(file, handleErrors) {
    setTimeout(() => {
      handleErrors(null, StatusCodes.Good, (done) => done());
    }, 10);
  }
}

// Ignore dependencies in tests
class WriteStream extends _WriteStream {
  dependenciesFor() {
    return [];
  }
}

/** @test {WriteStream} */
describe('WriteStream', function () {
  /** @test {WriteStream#processErrorMessage} */
  describe('#processErrorMessage', function () {
    it('should include nodeId', function () {
      expect(
        WriteStream.prototype.processErrorMessage(
          new AtviseFile({
            path: 'src/AGENT/DISPLAYS/Main.display',
            base: 'src',
          })
        ),
        'to contain',
        'AGENT.DISPLAYS.Main'
      );
    });
  });

  /** @test {WriteStream#processChunk} */
  describe('#processChunk', function () {
    it('should forward errors', function () {
      const stream = new WriteStream(new CreateNodeStream());

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) => callback(new Error('Test'));
      });

      return expect(
        [
          {
            nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
            typeDefinition: new NodeId('VariableTypes.ATVISE.Display', 0),
            nodeClass: NodeClass.Variable,
          },
        ],
        'when piped through',
        stream,
        'to error with',
        /Test/
      );
    });

    it('should forward synchronous errors', function () {
      const stream = new WriteStream(new CreateNodeStream());

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = () => {
          throw new Error('Sync test');
        };
      });

      return expect(
        [
          {
            nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
            typeDefinition: new NodeId('ns=1;s=VariableTypes.ATVISE.Display'),
            nodeClass: NodeClass.Variable,
          },
        ],
        'when piped through',
        stream,
        'to error with',
        /Sync test/
      );
    });

    it('should warn if access is denied', function () {
      const stream = new WriteStream(new CreateNodeStream());

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.BadUserAccessDenied);
      });

      const warnSpy = spy();
      Logger.on('warn', warnSpy);

      return expect(
        [
          {
            nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
            typeDefinition: new NodeId('ns=1;s=VariableTypes.ATVISE.Display'),
            nodeClass: NodeClass.Variable,
          },
        ],
        'when piped through',
        stream,
        'to yield objects satisfying',
        'to have length',
        0
      )
        .then(() => expect(warnSpy, 'was called once'))
        .then(() => expect(warnSpy.lastCall, 'to satisfy', [/opened in atvise builder/]));
    });

    it('should push non-variable files', function () {
      const createStream = new CreateNodeStream();
      const stream = new WriteStream(createStream);
      stream.pipe(createStream);

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.Good);
      });

      const file = {
        nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS'),
        typeDefinition: new NodeId('ns=0;i=61'),
        nodeClass: NodeClass.Object,
      };
      return expect([file], 'when piped through', stream, 'to yield objects satisfying', [
        expect.it('to be', file),
      ]);
    });

    it('should push files where no node can be found', function () {
      const createStream = new CreateNodeStream();
      const stream = new WriteStream(createStream);
      stream.pipe(createStream);

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.BadNodeIdUnknown);
      });

      const file = {
        nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
        typeDefinition: new NodeId('ns=1;s=VariableTypes.ATVISE.Display'),
        nodeClass: NodeClass.Variable,
      };
      return expect([file], 'when piped through', stream, 'to yield objects satisfying', [
        expect.it('to be', file),
      ]);
    });

    it('should push files with good status to add references stream', async function () {
      const pushToAddRefsStream = spy();
      const stream = new WriteStream(new CreateNodeStream(), {
        push: pushToAddRefsStream,
      });

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.Good);
      });

      const file = {
        nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Main'),
        typeDefinition: new NodeId('ns=1;s=VariableTypes.ATVISE.Display'),
        nodeClass: NodeClass.Variable,
      };
      await expect(
        [file],
        'when piped through',
        stream,
        'to yield objects satisfying',
        'to have length',
        0
      );

      return expect(pushToAddRefsStream, 'was called once');
    });
  });
});
