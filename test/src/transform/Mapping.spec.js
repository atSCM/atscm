import { Buffer } from 'buffer';
import { stub, spy } from 'sinon';
import { DataType, VariantArrayType, NodeClass } from 'node-opcua';
import File from 'vinyl';
import Logger from 'gulplog';
import expect from '../../expect';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import NodeId from '../../../src/lib/model/opcua/NodeId';
import AtviseFile from '../../../src/lib/server/AtviseFile';
import MappingTransformer from '../../../src/transform/Mapping';

/** @test {MappingTransformer} */
describe('MappingTransformer', function() {
  before(() => Logger.on('error', () => true));

  /** @test {MappingTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    context('when AtviseFile.fromReadResult returns error', function() {
      let warnListener;
      let debugListener;

      beforeEach(() => {
        stub(AtviseFile, 'fromReadResult').callsFake(() => {
          throw new Error('Test');
        });
        Logger.on('warn', (warnListener = spy()));
        Logger.on('debug', (debugListener = spy()));
      });

      afterEach(() => {
        AtviseFile.fromReadResult.restore();
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

    context('when AtviseFile.fromReadResult returns "no value" error', function() {
      let warnListener;
      let debugListener;

      beforeEach(() => {
        stub(AtviseFile, 'fromReadResult').callsFake(() => {
          throw new Error('no value');
        });
        Logger.on('warn', (warnListener = spy()));
        Logger.on('debug', (debugListener = spy()));
      });

      afterEach(() => {
        AtviseFile.fromReadResult.restore();
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
        nodeClass: NodeClass.Variable,
        value: {
          value: '<xml></xml>',
          $dataType: DataType.XmlElement,
          $arrayType: VariantArrayType.Scalar,
        },
        references: {
          HasTypeDefinition: [
            new NodeId('VariableTypes.ATVISE.Display'),
          ],
        },
      }], 'when piped through', stream, 'to yield chunks satisfying', [
        expect.it('to be an', AtviseFile),
      ]);
    });

    context('when file has non-standard type-definition', function() {
      it('should push a reference config file', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect([{
          nodeId: new NodeId('AGENT.OBJECTS.CustomVar'),
          nodeClass: NodeClass.Variable,
          value: {
            value: '<xml></xml>',
            $dataType: DataType.XmlElement,
            $arrayType: VariantArrayType.Scalar,
          },
          references: {
            HasTypeDefinition: [
              new NodeId('VariableTypes.PROJECT.CustomType'),
            ],
          },
        }], 'when piped through', stream, 'to yield chunks satisfying', [
          {
            basename: '.CustomVar.var.xml.json',
            contents: new Buffer(JSON.stringify({
              references: {
                HasTypeDefinition: [
                  'ns=1;s=VariableTypes.PROJECT.CustomType',
                ],
              },
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

    it('should skip non-atscm dot files', function() {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(cb => stream.transformFromFilesystem(
        { isDirectory: () => false, stem: '.eslintrc' }, 'utf8', cb
      ), 'to call the callback')
        .then(args => {
          expect(args, 'to have length', 1);
          expect(args[0], 'to be falsy');
        });
    });

    context('when file has non-standard type-definition', function() {
      context('with reference config file', function() {
        it('should read reference config file', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          return expect([
            new AtviseFile({
              path: 'AGENT/OBJECTS/.CustomVar.var.ext.json',
              contents: Buffer.from(JSON.stringify({ references: { HasTypeDefinition: [
                'ns=1;s=VariableTypes.PROJECT.CustomType',
              ] } })),
            }),
            new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }),
          ], 'when piped through', stream, 'to yield chunks satisfying', [
            {
              typeDefinition: new NodeId('VariableTypes.PROJECT.CustomType'),
            },
          ]);
        });
      });

      context('when reference config file is missing', function() {
        it('should forward error', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', /missing reference file/i);

          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });

      context('when .rc file cannot be parsed', function() {
        it('should forward error', function() {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', /Unexpected token/);

          stream.write(new AtviseFile({
            contents: Buffer.from('{ "invalid" }'),
            path: 'AGENT/OBJECTS/.CustomVar.var.ext.json',
          }));
          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });
    });
  });
});
