import { join } from 'path';
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
import { scalar, array, matrix } from '../../fixtures/dataTypes';

/** @test {MappingTransformer} */
describe.skip('MappingTransformer', function () {
  before(() => Logger.on('error', () => true));

  /** @test {MappingTransformer#transformFromDB} */
  describe('#transformFromDB', function () {
    context('when AtviseFile.fromReadResult returns error', function () {
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

      it('should not forward errors', function () {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(
          (cb) =>
            stream.transformFromDB(
              {
                nodeId: new NodeId('AGENT.DISPLAYS.Main'),
              },
              'utf8',
              cb
            ),
          'to call the callback'
        ).then((args) => expect(args, 'to have length', 1));
      });

      it('should log warning', function () {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(
          (cb) =>
            stream.transformFromDB(
              {
                nodeId: new NodeId('AGENT.DISPLAYS.Main'),
              },
              'utf8',
              cb
            ),
          'to call the callback'
        )
          .then((args) => expect(args, 'to have length', 1))
          .then(() => expect(warnListener, 'was called once'))
          .then(() => expect(debugListener, 'was called once'));
      });
    });

    context('when AtviseFile.fromReadResult returns "no value" error', function () {
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

      it('should only debug log', function () {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(
          (cb) =>
            stream.transformFromDB(
              {
                nodeId: new NodeId('AGENT.DISPLAYS.Main'),
              },
              'utf8',
              cb
            ),
          'to call the callback'
        )
          .then((args) => expect(args, 'to have length', 1))
          .then(() => expect(debugListener, 'was called twice'))
          .then(() => expect(warnListener, 'was not called'));
      });
    });

    it('should return an AtviseFile for the given ReadResult', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

      return expect(
        [
          {
            nodeId: new NodeId('AGENT.DISPLAYS.Main'),
            nodeClass: NodeClass.Variable,
            value: {
              value: '<xml></xml>',
              $dataType: DataType.XmlElement,
              $arrayType: VariantArrayType.Scalar,
            },
            references: {
              HasTypeDefinition: [new NodeId('VariableTypes.ATVISE.Display')],
            },
          },
        ],
        'when piped through',
        stream,
        'to yield chunks satisfying',
        [expect.it('to be an', AtviseFile)]
      );
    });

    context('when file has non-standard type-definition', function () {
      it('should push a reference config file', function () {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(
          [
            {
              nodeId: new NodeId('AGENT.OBJECTS.CustomVar'),
              nodeClass: NodeClass.Variable,
              value: {
                value: '<xml></xml>',
                $dataType: DataType.XmlElement,
                $arrayType: VariantArrayType.Scalar,
              },
              references: {
                HasTypeDefinition: [new NodeId('VariableTypes.PROJECT.CustomType')],
              },
            },
          ],
          'when piped through',
          stream,
          'to yield chunks satisfying',
          [
            {
              basename: '.CustomVar.var.xml.json',
              contents: new Buffer(
                JSON.stringify(
                  {
                    references: {
                      HasTypeDefinition: ['ns=1;s=VariableTypes.PROJECT.CustomType'],
                    },
                  },
                  null,
                  '  '
                )
              ),
            },
            {
              typeDefinition: new NodeId('VariableTypes.PROJECT.CustomType'),
            },
          ]
        );
      });

      it('should sort references', function () {
        const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

        return expect(
          [
            {
              nodeId: new NodeId('ObjectTypes.PROJECT.CustomType'),
              nodeClass: NodeClass.ObjectType,
              references: {
                toParent: 'HasSubtype',
                HasTypeDefinition: [new NodeId('VariableTypes.PROJECT.CustomType')],
                HasModellingRule: ['ns=0;i=78'],
              },
            },
          ],
          'when piped through',
          stream,
          'to yield chunks satisfying',
          [
            (file) => {
              expect(
                file.contents.toString(),
                'to equal',
                `{
  "references": {
    "HasModellingRule": [
      "ns=0;i=78"
    ],
    "HasTypeDefinition": [
      "ns=1;s=VariableTypes.PROJECT.CustomType"
    ],
    "toParent": "HasSubtype"
  }
}`
              );
            },
          ]
        );
      });
    });
  });

  /** @test {MappingTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function () {
    it('should write AtviseFiles for read Files', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(
        [new File({ path: 'Test.ext' })],
        'when piped through',
        stream,
        'to yield chunks satisfying',
        [expect.it('to be an', AtviseFile)]
      );
    });

    it('should keep base', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(
        (cb) =>
          stream.transformFromFilesystem(
            new File({ path: 'folder/Test.ext', base: 'folder' }),
            'utf8',
            cb
          ),
        'to call the callback'
      ).then((args) => {
        expect(args[0], 'to be falsy');

        const result = args[1];
        expect(result.base, 'to equal', 'folder');
        expect(result.relative, 'to equal', 'Test.ext');
      });
    });

    it('should skip directories', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(
        (cb) => stream.transformFromFilesystem({ isDirectory: () => true }, 'utf8', cb),
        'to call the callback'
      ).then((args) => {
        expect(args, 'to have length', 1);
        expect(args[0], 'to be falsy');
      });
    });

    it('should skip non-atscm dot files', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(
        (cb) =>
          stream.transformFromFilesystem(
            { isDirectory: () => false, stem: '.eslintrc' },
            'utf8',
            cb
          ),
        'to call the callback'
      ).then((args) => {
        expect(args, 'to have length', 1);
        expect(args[0], 'to be falsy');
      });
    });

    context('when file has non-standard type-definition', function () {
      context('with reference config file', function () {
        it('should read reference config file', function () {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          return expect(
            [
              new AtviseFile({
                path: 'AGENT/OBJECTS/.CustomVar.var.ext.json',
                contents: Buffer.from(
                  JSON.stringify({
                    references: { HasTypeDefinition: ['ns=1;s=VariableTypes.PROJECT.CustomType'] },
                  })
                ),
              }),
              new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }),
            ],
            'when piped through',
            stream,
            'to yield chunks satisfying',
            [
              {
                typeDefinition: new NodeId('VariableTypes.PROJECT.CustomType'),
              },
            ]
          );
        });
      });

      context('when reference config file is missing', function () {
        it('should forward error', function () {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', /missing reference file/i);

          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });

      context('when .rc file cannot be parsed', function () {
        it('should forward error', function () {
          const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

          const promise = expect(stream, 'to error with', /Unexpected token/);

          stream.write(
            new AtviseFile({
              contents: Buffer.from('{ "invalid" }'),
              path: 'AGENT/OBJECTS/.CustomVar.var.ext.json',
            })
          );
          stream.write(new AtviseFile({ path: 'AGENT/OBJECTS/CustomVar.var.ext' }));
          stream.end();

          return promise;
        });
      });
    });
  });

  describe('should be able to map all types', function () {
    async function testFromDBMapping({ sample }) {
      const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

      const [err, [result]] = await expect(
        [
          Object.assign({}, sample, {
            nodeId: new NodeId(`AGENT.OBJECTS.allTypes.${sample.dataType}${sample.arrayType}`),
            value: {
              value: sample.value,
              $dataType: sample.dataType,
              $arrayType: sample.arrayType,
            },
            references: {
              toParent: 'HasComponent',
              HasTypeDefinition: [new NodeId('ns=0;i=62')],
            },
          }),
        ],
        'when piped through',
        stream,
        'to yield chunks satisfying',
        [(chunk) => expect(chunk, 'to be an', AtviseFile) && chunk]
      );

      expect(err, 'to be falsy');
      expect(result.value, 'to equal', sample.value);

      return result;
    }

    scalar.forEach((sample, i) => {
      context(`when mapping ${sample.dataType}s`, function () {
        it('should map scalar values', async function () {
          return testFromDBMapping({ sample });
        });
        it('should map array values', async function () {
          return testFromDBMapping({ sample: array[i] });
        });
        it('should map matrix values', async function () {
          return testFromDBMapping({ sample: matrix[i] });
        });
      });
    });
  });

  context('when a resource property is mapped', function () {
    it('should wrap nodes in `.inner` folder', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromDB });

      return expect(
        [
          {
            nodeId: new NodeId('SYSTEM.LIBRARY.RESOURCES/index.html.Translate'),
            parent: new NodeId('SYSTEM.LIBRARY.RESOURCES/index.html'),
            nodeClass: NodeClass.Variable,
            value: {
              value: true,
              $dataType: DataType.Boolean,
              $arrayType: VariantArrayType.Scalar,
            },
            references: {
              HasTypeDefinition: [new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0)],
            },
          },
        ],
        'when piped through',
        stream,
        'to yield chunks satisfying',
        [
          {
            dirname: join('SYSTEM/LIBRARY/RESOURCES/index.html.inner'),
            basename: 'Translate.prop.bool',
            contents: Buffer.from('true'),
          },
        ]
      );
    });

    it('should unwrap properties `.inner` folder', function () {
      const stream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

      return expect(
        [
          new AtviseFile({
            path: join('SYSTEM/LIBRARY/RESOURCES/test.htm.inner/Translate.prop.bool'),
            contents: Buffer.from('true'),
          }),
        ],
        'when piped through',
        stream,
        'to yield chunks satisfying',
        [
          {
            path: join('SYSTEM/LIBRARY/RESOURCES/test.htm/Translate.prop.bool'),
            value: true,
          },
        ]
      );
    });
  });
});
