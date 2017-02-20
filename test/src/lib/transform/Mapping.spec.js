import File from 'vinyl';
import { DataType, VariantArrayType } from 'node-opcua';
import expect from '../../../expect';
import Transformer from '../../../../src/lib/transform/Transformer';
import MappingTransformer from '../../../../src/lib/transform/Mapping';
import NodeId from '../../../../src/lib/server/NodeId';
import AtviseTypes from '../../../../src/lib/server/Types';

/** @test {MappingTransformer} */
describe('MappingTransformer', function() {
  /** @test {MappingTransformer#constructor} */
  describe('#constructor', function() {
    it('should return a Transformer', function() {
      expect(new MappingTransformer(), 'to be a', Transformer);
    });
  });

  function testFromDB(options) {
    it(options.name, function() {
      const transformer = new MappingTransformer();

      return expect(cb => transformer.transformFromDB({
        nodeId: options.nodeId,
        value: {
          value: 'Test',
          $dataType: options.dataType,
          $arrayType: options.arrayType,
        },
        referenceDescription: {
          typeDefinition: options.typeDefinition,
        },
      }, 'utf8', cb), 'to call the callback')
        .then(args => {
          expect(args[1], 'to be a', File);
          expect(args[1].relative, 'to equal', options.filePath);
          expect(args[1].dataType, 'to equal', options.dataType);
          expect(args[1].typeDefinition, 'to equal', options.typeDefinition);
        });
    });
  }

  function testFromFilesystem(options) {
    const file = new File({
      path: options.filePath,
      contents: null,
    });

    it(options.name, function() {
      const transformer = new MappingTransformer();

      return expect(cb => transformer.transformFromFilesystem(file, 'utf8', cb),
        'to call the callback')
        .then(args => {
          expect(args[1], 'to be a', File);
          expect(args[1].dataType, 'to equal', options.dataType);
          expect(args[1].arrayType, 'to equal', options.arrayType);
          expect(args[1].typeDefinition, 'to equal', options.typeDefinition);
        });
    });
  }

  const tests = [
    {
      name: 'should store variables with their data type as an extension',
      nodeId: new NodeId('ns=1;s=AGENT.OBJECTS.Test'),
      dataType: DataType.UInt16,
      typeDefinition: new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0),
      arrayType: VariantArrayType.Scalar,
      filePath: 'AGENT/OBJECTS/Test.uint16',
    },
    {
      name: 'should store variable arrays with their data type as an extension',
      nodeId: new NodeId('ns=1;s=AGENT.OBJECTS.Test'),
      dataType: DataType.UInt16,
      typeDefinition: new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0),
      arrayType: VariantArrayType.Array,
      filePath: 'AGENT/OBJECTS/Test.uint16.array',
    },
    {
      name: 'should store variable matrices with their data type as an extension',
      nodeId: new NodeId('ns=1;s=AGENT.OBJECTS.Test'),
      dataType: DataType.UInt16,
      typeDefinition: new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0),
      arrayType: VariantArrayType.Matrix,
      filePath: 'AGENT/OBJECTS/Test.uint16.matrix',
    },
    {
      name: 'should store property variables with their data type as an extension',
      nodeId: new NodeId('ns=1;s=AGENT.OBJECTS.Test.property'),
      dataType: DataType.UInt16,
      typeDefinition: new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0),
      arrayType: VariantArrayType.Scalar,
      filePath: 'AGENT/OBJECTS/Test/property.prop.uint16',
    },
    {
      name: 'should store html help documents with a ".help.html" extension',
      nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Test.en'),
      dataType: DataType.XmlElement,
      typeDefinition: new NodeId('VariableTypes.ATVISE.HtmlHelp'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'AGENT/DISPLAYS/Test/en.help.html',
    },
    {
      name: 'should store quickdynamics with a ".qd.xml" extension',
      nodeId: new NodeId('ns=1;s=SYSTEM.LIBRARY.PROJECT.QUICKDYNAMICS.Test'),
      dataType: DataType.XmlElement,
      typeDefinition: new NodeId('VariableTypes.ATVISE.QuickDynamic'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'SYSTEM/LIBRARY/PROJECT/QUICKDYNAMICS/Test.qd.xml',
    },
    {
      name: 'should store scripts with a ".script.xml" extension',
      nodeId: new NodeId('ns=1;s=SYSTEM.LIBRARY.PROJECT.SERVERSCRIPTS.Test'),
      dataType: DataType.XmlElement,
      typeDefinition: new NodeId('VariableTypes.ATVISE.ScriptCode'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'SYSTEM/LIBRARY/PROJECT/SERVERSCRIPTS/Test.script.xml',
    },
    {
      name: 'should store displays with a ".display.xml" extension',
      nodeId: new NodeId('ns=1;s=AGENT.DISPLAYS.Test'),
      dataType: DataType.XmlElement,
      typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'AGENT/DISPLAYS/Test.display.xml',
    },
    {
      name: 'should store scripts with a ".locs.xml" extension',
      nodeId: new NodeId('ns=1;s=SYSTEM.LIBRARY.PROJECT.de'),
      dataType: DataType.XmlElement,
      typeDefinition: new NodeId('VariableTypes.ATVISE.TranslationTable'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'SYSTEM/LIBRARY/PROJECT/de.locs.xml',
    },
    {
      name: 'should store custom resources with their original extension',
      nodeId: new NodeId('ns=1;s=SYSTEM.LIBRARY.PROJECT.RESOURCES/Test.md'),
      dataType: DataType.ByteString,
      typeDefinition: new NodeId('VariableTypes.ATVISE.Resource.OctetStream'),
      arrayType: VariantArrayType.Scalar,
      filePath: 'SYSTEM/LIBRARY/PROJECT/RESOURCES/Test.md',
    },
  ].concat(
    AtviseTypes.filter(t => t.constructor.name === 'AtviseResourceType')
      .map(t => ({
        name: `should store ${t.typeDefinition.value} resources with their original extension`,
        nodeId: new NodeId(`ns=1;s=SYSTEM.LIBRARY.PROJECT.RESOURCES/Test.${t.identifier}`),
        dataType: DataType.ByteString,
        typeDefinition: new NodeId(t.typeDefinition.value),
        arrayType: VariantArrayType.Scalar,
        filePath: `SYSTEM/LIBRARY/PROJECT/RESOURCES/Test.${t.identifier}`,
      }))
  );

  /** @test {MappingTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    it('should not transform without a value', function() {
      const transformer = new MappingTransformer();

      expect(transformer.transformFromDB({
        value: null,
      }), 'to call the callback')
        .then(args => expect(args, 'to have length', 1));
    });

    tests.forEach(test => testFromDB(test));
  });

  /** @test {MappingTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function() {
    tests.forEach(test => testFromFilesystem(test));
  });
});
