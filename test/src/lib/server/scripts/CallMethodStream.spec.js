import { DataType } from 'node-opcua';
import expect from '../../../../expect';
import CallMethodStream from '../../../../../src/lib/server/scripts/CallMethodStream';
import NodeId from '../../../../../src/lib/server/NodeId';

class InvalidMethodStub extends CallMethodStream {

  get methodId() {
    return new NodeId(NodeId.NodeIdType.STRING, 'path.to.unknown.method', 1);
  }

}

class ValidMethodStub extends CallMethodStream {

  get methodId() {
    return new NodeId(NodeId.NodeIdType.STRING, 'AGENT.OPCUA.METHODS.importNodes', 1);
  }

  inputArguments(file) {
    return [
      {
        dataType: DataType.NodeId,
        value: new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0),
      },
      {
        dataType: DataType.XmlElement,
        value: file.contents,
      },
    ];
  }

}

/** @test {CallMethodStream} */
describe('CallMethodStream', function() {
  /** @test {CallMethodStream#methodId} */
  describe('#methodId', function() {
    it('throws an error if not overridden', function() {
      return expect(() => CallMethodStream.prototype.methodId,
        'to throw error', /must be implemented/i);
    });
  });

  /** @test {CallMethodStream#methodBaseId} */
  describe('#methodBaseId', function() {
    it('defaults to the method\'s parent id', function() {
      const base = InvalidMethodStub.prototype.methodBaseId;

      expect(base, 'to be a', NodeId);
      expect(base.value, 'to equal', 'path.to.unknown');
      expect(base.namespace, 'to equal', 1);
    });
  });

  /** @test {CallMethodStream#inputArguments} */
  describe('#inputArguments', function() {
    it('defaults to an empty array', function() {
      const args = CallMethodStream.prototype.inputArguments({});

      expect(args, 'to equal', []);
    });
  });

  /** @test {CallMethodStream#callRequest} */
  describe('#callRequest', function() {
    it('uses #methodId, #baseMethodId and #inputArguments', function() {
      const request = InvalidMethodStub.prototype.callRequest({});

      expect(request, 'to be an object');
      expect(request.methodId, 'to equal', InvalidMethodStub.prototype.methodId);
      expect(request.objectId, 'to equal', InvalidMethodStub.prototype.methodBaseId);
      expect(request.inputArguments, 'to equal', InvalidMethodStub.prototype.inputArguments({}));
    });
  });

  /** @test {CallMethodStream#handleOutputArguments} */
  describe('#handleOutputArguments', function() {
    it('throws if not overridden', function() {
      return expect(CallMethodStream.prototype.handleOutputArguments,
        'to throw error', /must be implemented/i);
    });
  });

  /** @test {CallMethodStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    context('processed message', function() {
      const message = InvalidMethodStub.prototype.processErrorMessage({
        relative: 'relative/path',
      });

      it('should include methodId', function() {
        expect(message, 'to contain', 'path.to.unknown.method');
      });

      it('should include relative file path', function() {
        expect(message, 'to contain', 'relative/path');
      });
    });
  });

  /** @test {CallMethodStream#processChunk} */
  describe('#processChunk', function() {
    it('should handle synchronous errors', function() {
      const stream = new CallMethodStream();

      return expect([{}], 'when piped through', stream, 'to error').then(error => {
        expect(error.message, 'to match', /must be implemented/i);
      });
    });

    it('should handle asynchronous errors', function() {
      const stream = new InvalidMethodStub();

      stream.once('session-open', () => {
        stream.session.close(() => {});
      });

      return expect([{}], 'when piped through', stream, 'to error').then(error => {
        expect(error.message, 'to contain', 'BadSessionIdInvalid');
      });
    });

    it('should report bad status codes', function() {
      const importStream = new InvalidMethodStub();

      return expect([{}], 'when piped through', importStream, 'to error').then(error => {
        expect(error.message, 'to contain', 'does not exist in the server address space');
      });
    });

    it('should report non-unsuccessful operations', async function() {
      const importStream = new ValidMethodStub();

      importStream.handleOutputArguments = function(file, args, callback) {
        callback(new Error('Test error'));
      };

      const error = await expect([{ contents: Buffer.from('invalid') }], 'when piped through',
        importStream, 'to error');

      expect(error.message, 'to end with', 'Test error');
    });
  });
});
