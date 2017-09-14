import { Buffer } from 'buffer';
import { stub, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { DataType, VariantArrayType } from 'node-opcua';
import File from 'vinyl';
import Logger from 'gulplog';
import expect from '../../expect';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import NodeId from '../../../src/lib/server/NodeId';
import AtviseFile from '../../../src/lib/server/AtviseFile';

const readFile = (path, enc, cb) => cb(null, JSON.stringify({
  typeDefinition: 'ns=1;s=VariableTypes.PROJECT.Custom',
}));
const fs = { readFile };

const MappingTransformer = proxyquire('../../../src/transform/Mapping', { fs }).default;

/** @test {MappingTransformer} */
describe('MappingTransformer', function() {
  before(() => Logger.on('error', () => true));

  /** @test {MappingTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    context('when AtviseFile.fromMappingItem returns error', function() {
      let warnListener;
      let debugListener;

      beforeEach(() => {
        stub(AtviseFile, 'fromReadResult', () => {
          throw new Error('Test');
        });
        Logger.on('warn', (warnListener = spy()));
        Logger.on('debug', (debugListener = spy()));
      });

      afterEach(() => {
        AtviseFile.fromMappingItem.restore();
        Logger.removeListener('warn', warnListener);
        Logger.removeListener('debug', debugListener);
      });

      it('should not forward errors', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(cb => stream.transformFromDB({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
        }, 'utf8', cb), 'to call the callback')
          .then(args => expect(args, 'to have length', 1));
      });

      it('should log warning', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(cb => stream.transformFromDB({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
        }, 'utf8', cb), 'to call the callback')
          .then(args => expect(args, 'to have length', 1))
          .then(() => expect(warnListener, 'was called once'))
          .then(() => expect(debugListener, 'was called once'));
      });
    });

    context('when AtviseFile.fromMappingItem returns "no value" error', function() {
      let warnListener;
      let debugListener;

      beforeEach(() => {
        stub(AtviseFile, 'fromReadResult', () => {
          throw new Error('no value');
        });
        Logger.on('warn', (warnListener = spy()));
        Logger.on('debug', (debugListener = spy()));
      });

      afterEach(() => {
        AtviseFile.fromMappingItem.restore();
        Logger.removeListener('warn', warnListener);
        Logger.removeListener('debug', debugListener);
      });

      it('should only debug log', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(cb => stream.transformFromDB({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
        }, 'utf8', cb), 'to call the callback')
          .then(args => expect(args, 'to have length', 1))
          .then(() => expect(debugListener, 'was called twice'))
          .then(() => expect(warnListener, 'was not called'));
      });
    });

    it('should return an AtviseFile for the given ReadResult', function() {
      const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

      return expect([{
        nodeId: new NodeId('AGENT.DISPLAYS.Main'),
        value: {
          value: '<xml></xml>',
          $dataType: DataType.XmlElement,
          $arrayType: VariantArrayType.Scalar,
        },
        referenceDescription: {
          typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
        },
      }], 'when piped through', stream, 'to yield chunks satisfying', [
        expect.it('to be an', AtviseFile),
      ]);
    });

    context('when file has non-standard type-definition', function() {
      it('should push .rc file', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect([{
          nodeId: new NodeId('AGENT.OBJECTS.CustomVar'),
          value: {
            value: '<xml></xml>',
            $dataType: DataType.XmlElement,
            $arrayType: VariantArrayType.Scalar,
          },
          referenceDescription: {
            typeDefinition: new NodeId('VariableTypes.PROJECT.CustomType'),
          },
        }], 'when piped through', stream, 'to yield chunks satisfying', [
          {
            contents: new Buffer(JSON.stringify({
              typeDefinition: 'ns=1;s=VariableTypes.PROJECT.CustomType',
            }, null, '  ')),
          },
          {
            typeDefinition: new NodeId('VariableTypes.PROJECT.CustomType'),
          },
        ]);
      });
    });
  });

  /** @test {MappingTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function() {
    it('should write AtviseFiles for read Files', function() {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect([
        new File({ path: 'Test.ext' }),
      ], 'when piped through', stream,
      'to yield chunks satisfying', [
        expect.it('to be an', AtviseFile),
      ]);
    });

    it('should keep base', function() {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(cb => stream.transformFromFilesystem(
        new File({ path: 'folder/Test.ext', base: 'folder' }), 'utf8', cb
      ), 'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');

          const result = args[1];
          expect(result.base, 'to equal', 'folder');
          expect(result.relative, 'to equal', 'Test.ext');
        });
    });

    it('should skip directories', function() {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(cb => stream.transformFromFilesystem(
        { isDirectory: () => true }, 'utf8', cb
      ), 'to call the callback')
        .then(args => {
          expect(args, 'to have length', 1);
          expect(args[0], 'to be falsy');
        });
    });

    context('when file has non-standard type-definition', function() {
      context('with .rc file', function() {
        before(() => spy(fs, 'readFile'));
        after(() => fs.readFile.restore());

        it('should read .rc file', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          return expect([
            new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }),
          ], 'when piped through', stream)
            .then(() => {
              expect(fs.readFile, 'was called once');
            });
        });
      });

      context('when .rc file cannot be read', function() {
        beforeEach(() => stub(fs, 'readFile', (path, enc, cb) => cb(new Error('Test'))));
        afterEach(() => fs.readFile.restore());

        it('should forward error', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', 'Test');

          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });

      context('when .rc file cannot be parsed', function() {
        beforeEach(() => stub(fs, 'readFile', (path, enc, cb) => cb(null, 'invalid')));
        afterEach(() => fs.readFile.restore());

        it('should forward error', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', /Unexpected token i in JSON/);

          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });
    });
  });
});
