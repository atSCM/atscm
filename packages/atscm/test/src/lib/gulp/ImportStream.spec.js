import { join, sep as separator } from 'path';
import { DataType, NodeId } from 'node-opcua';
import { src } from 'gulp';
import { obj as createTransformStream } from 'through2';
import replace from 'buffer-replace';
import expect from '../../../expect';
import ImportStream from '../../../../src/lib/gulp/ImportStream';
import Session from '../../../../src/lib/server/Session';

/** @test {ImportStream} */
describe('ImportStream', function () {
  /** @test {ImportStream#methodId} */
  describe('#methodId', function () {
    it('should return importNodes method id', function () {
      expect(
        ImportStream.prototype.methodId.toString(),
        'to equal',
        'ns=1;s=AGENT.OPCUA.METHODS.importNodes'
      );
    });
  });

  /** @test {ImportStream#inputArguments} */
  describe('#inputArguments', function () {
    it('should contain global scope argument', function () {
      const [scope] = ImportStream.prototype.inputArguments({});

      expect(scope.value, 'to be a', NodeId);
      expect(scope.value.namespace, 'to equal', 0);
      expect(scope.value.value, 'to equal', 0);
    });

    it('should contain file contents', function () {
      const contents = 'test';
      const fileArg = ImportStream.prototype.inputArguments({ contents })[1];

      expect(fileArg.value, 'to equal', contents);
      expect(fileArg.dataType, 'to equal', DataType.XmlElement);
    });
  });

  /** @test {ImportStream#processErrorMessage} */
  describe('#processErrorMessage', function () {
    it('should prefix file path', function () {
      const path = 'TestPath';

      return expect(
        ImportStream.prototype.processErrorMessage,
        'when called with',
        [{ path }],
        'to begin with',
        'Error importing file'
      );
    });

    it('should print path relative to project directory', function () {
      const relative = ['path', 'to', 'file'].join(separator);

      return expect(
        ImportStream.prototype.processErrorMessage,
        'when called with',
        [{ relative }],
        'to end with',
        relative
      );
    });
  });

  /** @test {ImportStream#handleOutputArguments} */
  describe('#handleOutputArguments', function () {
    it('should error if import failed', function () {
      return expect(
        (cb) => ImportStream.prototype.handleOutputArguments({}, [{ value: false }], cb),
        'to call the callback with error',
        'Import failed'
      );
    });

    it('should error without status', function () {
      return expect(
        (cb) => ImportStream.prototype.handleOutputArguments({}, undefined, cb),
        'to call the callback with error',
        'Import failed'
      );
    });

    it('should not error if import succeeded', function () {
      return expect(
        (cb) => ImportStream.prototype.handleOutputArguments({}, [{ value: true }], cb),
        'to call the callback without error'
      );
    });
  });

  /** @test {ImportStream#processChunk} */
  describe('#processChunk', function () {
    it('should create new nodes on success', async function () {
      const nodeName = `TestNode-${Date.now()}`;
      const fixturePath = join(__dirname, '../../../fixtures/TestImport.xml');
      const replaceStream = createTransformStream((file, enc, callback) => {
        callback(
          null,
          Object.assign(file, {
            contents: replace(file.contents, 'TestNode', nodeName),
          })
        );
      });
      const importStream = new ImportStream();

      // eslint-disable-next-line no-console
      console.log(`Importing test node: ${nodeName}`);

      await expect(
        src(fixturePath).pipe(replaceStream).pipe(importStream),
        'to yield objects satisfying',
        []
      );

      const session = await Session.create();

      const [value] = await expect(
        (cb) => session.readVariableValue([`ns=1;s=AGENT.OBJECTS.${nodeName}`], cb),
        'to call the callback without error'
      );

      return expect(value[0].value.value, 'to equal', 13);
    });
  });
});
