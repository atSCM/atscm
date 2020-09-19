import { DataType } from 'node-opcua';
import expect from '../../../../expect';
import CallScriptStream from '../../../../../src/lib/server/scripts/CallScriptStream';
import NodeId from '../../../../../src/lib/model/opcua/NodeId';

class StubImplementation extends CallScriptStream {
  get scriptId() {
    return new NodeId('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.Stub');
  }
}

class StubAtscmImplementation extends CallScriptStream {
  get scriptId() {
    return new NodeId('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.Stub');
  }
}

class WithParams extends StubImplementation {
  scriptParameters(file) {
    // eslint-disable-line no-unused-vars
    return {
      filename: {
        dataType: DataType.String,
        value: file.stem,
      },
    };
  }
}

/** @test {CallScriptStream} */
describe('CallScriptStream', function () {
  /** @test {CallScriptStream#methodId} */
  describe('#methodId', function () {
    it("should return the callScript method's id", function () {
      return expect(
        CallScriptStream.prototype.methodId.value,
        'to equal',
        'AGENT.SCRIPT.METHODS.callScript'
      );
    });
  });

  /** @test {CallScriptStream#scriptId} */
  describe('#scriptId', function () {
    it('should throw if not overridden', function () {
      return expect(() => CallScriptStream.prototype.scriptId, 'to throw', /must be implemented/i);
    });
  });

  /** @test {CallScriptStream#scriptParameters} */
  describe('#scriptParameters', function () {
    it('should return an empty object if not overridden', function () {
      return expect(
        CallScriptStream.prototype.scriptParameters,
        'when called with',
        [{}],
        'to equal',
        {}
      );
    });
  });

  /** @test {CallScriptStream#inputArguments} */
  describe('#inputArguments', function () {
    it('should return an array of node-opcua~Variants', function () {
      const stream = new StubImplementation();

      return expect(
        () => stream.inputArguments({}),
        'when called with',
        [{}],
        'to have items satisfying',
        expect.it((item) => {
          expect(item, 'to be an object');
          expect(item, 'to have property', 'dataType');
          expect(item, 'to have property', 'value');
        })
      );
    });

    it('should return names and values from #scriptParameters', function () {
      const stream = new WithParams();
      const file = { stem: 'test' };
      const [{ value: paramNames }, { value: paramValues }] = stream.inputArguments(file).slice(2);

      expect(paramNames, 'to equal', ['filename']);
      expect(paramValues, 'to equal', [
        {
          dataType: DataType.String,
          value: 'test',
        },
      ]);
    });
  });

  /** @test {CallScriptStream#processErrorMessage} */
  describe('#processErrorMessage', function () {
    it("should include the file's name", function () {
      return expect(
        (f) => new StubImplementation().processErrorMessage(f),
        'when called with',
        [{ relative: './path/file' }],
        'to end with',
        './path/file'
      );
    });

    it("should include the called script's id", function () {
      return expect(
        (f) => new StubImplementation().processErrorMessage(f),
        'when called with',
        [{ relative: './path/file' }],
        'to contain',
        'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.Stub'
      );
    });
  });

  /** @test {CallScriptStream#processChunk} */
  describe('#processChunk', function () {
    it('should process as usual if not called on atscm script', function () {
      const stream = new StubImplementation();

      return expect(
        [{ relative: 'relative/path', nodeId: new NodeId('Stub') }],
        'when piped through',
        stream,
        'to error with',
        /Error running script/
      );
    });

    it("should suggest running 'atscm import' if atscm script is missing", function () {
      const stream = new StubAtscmImplementation();

      return expect(
        [{ relative: 'relative/path', nodeId: new NodeId('Stub') }],
        'when piped through',
        stream,
        'to error with',
        /Did you forget to run 'atscm import'?/
      );
    });
  });
});
