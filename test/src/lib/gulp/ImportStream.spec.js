import { join, sep as separator } from 'path';
import { DataType, NodeId } from 'node-opcua';
import { src } from 'gulp';
import { obj as createTransformStream } from 'through2';
import replace from 'buffer-replace';
import expect from '../../../expect';
import ImportStream from '../../../../src/lib/gulp/ImportStream';
import Session from '../../../../src/lib/server/Session';

/** @test {ImportStream} */
describe('ImportStream', function() {
  /** @test {ImportStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should prefix file path', function() {
      const path = 'TestPath';

      return expect(ImportStream.prototype.processErrorMessage, 'when called with', [{ path }],
        'to begin with', 'Error importing file'
      );
    });

    it('should print path relative to project directory', function() {
      const relative = ['path', 'to', 'file'].join(separator);
      const path = join(process.cwd(), relative);

      return expect(ImportStream.prototype.processErrorMessage, 'when called with', [{ path }],
        'to end with', relative
      );
    });
  });

  /** @test {ImportStream#createCallObject} */
  describe('#createCallObject', function() {
    it('should return a valid call object', function() {
      const contents = Buffer.from('Test contents');

      return expect(ImportStream.prototype.createCallObject, 'called with', [{ contents }])
        .then(({ objectId, methodId, inputArguments: [scope, node] }) => {
          expect(objectId, 'to equal', 'ns=1;s=AGENT.OPCUA.METHODS');
          expect(methodId, 'to equal', 'ns=1;s=AGENT.OPCUA.METHODS.importNodes');
          expect(scope, 'to satisfy', {
            dataType: DataType.NodeId,
            value: new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0),
          });
          expect(node, 'to equal', {
            dataType: DataType.XmlElement,
            value: contents,
          });
        });
    });
  });

  const invalidFile = { contents: 'Not a buffer', path: 'path/does/not/exist' };

  /** @test {ImportStream#processChunk} */
  describe('#processChunk', function() {
    it('should handle synchronous errors', function() {
      const importStream = new ImportStream();

      importStream.once('session-open', () => {
        importStream.session.call = function() {
          throw new Error('Sync error');
        };
      });

      return expect([invalidFile], 'when piped through', importStream, 'to error').then(error => {
        expect(error.message, 'to contain', 'Sync error');
      });
    });

    it('should handle asynchronous errors', function() {
      const importStream = new ImportStream();

      importStream.once('session-open', () => {
        importStream.session.close(() => {});
      });

      return expect([invalidFile], 'when piped through', importStream, 'to error').then(error => {
        expect(error.message, 'to contain', 'BadSessionIdInvalid');
      });
    });

    it('should report bad status codes', function() {
      class InvalidCallImportStream extends ImportStream {

        createCallObject(...args) {
          return Object.assign(super.createCallObject(...args), {
            methodId: 'ns=1;s=Method.That.Does.Not.Exist',
          });
        }

      }

      const importStream = new InvalidCallImportStream();

      return expect([invalidFile], 'when piped through', importStream, 'to error').then(error => {
        expect(error.message, 'to contain', 'does not exist in the server address space');
      });
    });

    it('should report unsucessful operations', function() {
      const importStream = new ImportStream();

      return expect([invalidFile], 'when piped through', importStream, 'to error').then(error => {
        expect(error.message, 'to contain', 'No success');
      });
    });

    it('should create new nodes on success', function() {
      const nodeName = `TestNode-${Date.now()}`;
      const fixturePath = join(__dirname, '../../../fixtures/TestImport.xml');
      const replaceStream = createTransformStream((file, enc, callback) => {
        callback(null, Object.assign(file, {
          contents: replace(file.contents, 'TestNode', nodeName),
        }));
      });
      const importStream = new ImportStream();

      // eslint-disable-next-line no-console
      console.log(`Creating test node: ${nodeName}`);

      return expect(
        src(fixturePath)
          .pipe(replaceStream)
          .pipe(importStream),
        'to yield objects satisfying', [])
        // Check node was actually created (TestNode is a Float with value `13`)
        .then(Session.create)
        .then(session => expect(
          cb => session.readVariableValue([`ns=1;s=AGENT.OBJECTS.${nodeName}`], cb),
          'to call the callback without error'
        ))
        .then(([value]) => expect(value[0].value.value, 'to equal', 13));
    });
  });
});
