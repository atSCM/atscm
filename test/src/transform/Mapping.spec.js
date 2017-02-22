import { stub } from 'sinon';
import { DataType, VariantArrayType } from 'node-opcua';
import File from 'vinyl';
import expect from '../../expect';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import MappingTransformer from '../../../src/transform/Mapping';
import NodeId from '../../../src/lib/server/NodeId';
import AtviseFile from '../../../src/lib/server/AtviseFile';

/** @test {MappingTransformer} */
describe('MappingTransformer', function() {
  /** @test {MappingTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    context('when AtviseFile.fromReadResult returns error', function() {
      before(() => stub(AtviseFile, 'fromReadResult', () => {
        throw new Error('Test');
      }));

      after(() => AtviseFile.fromReadResult.restore());

      it('should not forward errors', function() {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        expect(cb => stream.transformFromDB({
          nodeId: new NodeId('AGENT.DISPLAYS.Main')
        }, 'utf8', cb), 'to call the callback')
          .then(args => expect(args, 'to have length', 1));
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
          console.log(result);
          expect(result.base, 'to equal', 'folder');
          expect(result.relative, 'to equal', 'Test.ext');
        });
    });
  });
});
