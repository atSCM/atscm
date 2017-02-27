import expect from 'unexpected';
import { stub } from 'sinon';

import { Buffer } from 'buffer';
import File from 'vinyl';
import { DataType, VariantArrayType } from 'node-opcua';
import AtviseFile from '../../../../src/lib/server/AtviseFile';
import AtviseTypes from '../../../../src/lib/server/Types';
import NodeId from '../../../../src/lib/server/NodeId';

/** @test {AtviseFile} */
describe('AtviseFile', function() {
  /** @test {AtviseFile#constructor} */
  describe('#constructor', function() {
    it('should create a vinyl instance', function() {
      const file = new AtviseFile();

      expect(file, 'to be a', File);
    });
  });

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

  /** @test {AtviseFile.pathForReadResult} */
  describe('.pathForReadResult', function() {
    tests.forEach(test => {
      it(test.name, function() {
        expect(AtviseFile.pathForReadResult({
          nodeId: test.nodeId,
          value: {
            $dataType: test.dataType,
            $arrayType: test.arrayType,
          },
          referenceDescription: {
            typeDefinition: test.typeDefinition,
          },
        }), 'to equal', test.filePath);
      });
    })
  });

  /** @test {AtviseFile.encodeValue} */
  describe('.encodeValue', function() {
    it('should forward null', function() {
      expect(AtviseFile.encodeValue(null), 'to equal', null);
    });

    it('should store timestamp as string for DateTime values', function() {
      const now = new Date();

      expect(AtviseFile.encodeValue({ value: now }, DataType.DateTime),
        'to equal', Buffer.from(now.getTime().toString()));
    });
  });

  /** @test {AtviseFile.decodeValue} */
  describe('.decodeValue', function() {
    it('should forward null', function() {
      expect(AtviseFile.decodeValue(null), 'to equal', null);
    });

    function testDecoderForDataType(dataType, rawValue, expectedValue) {
      it(`decoder for ${dataType} should work`, function() {
        expect(AtviseFile.decodeValue(Buffer.from(rawValue), dataType),
          'to satisfy', expectedValue);
      });
    }

    const now = (new Date());

    [
      [DataType.Boolean, 'false', false],
      [DataType.Boolean, 'true', true],
      [DataType.String, 'test', 'test'],
      [DataType.NodeId, 'ns=1;s=AGENT.DISPLAYS.Main', new NodeId('AGENT.DISPLAYS.Main')],
      [DataType.DateTime, now.getTime().toString(), now],
    ].forEach(t => testDecoderForDataType(...t));

    it('should forward buffer without spection encoding', function() {
      const buffer = new Buffer('test');
      expect(AtviseFile.decodeValue(buffer, DataType.ByteString), 'to equal', buffer);
    });
  });

  /** @test {AtviseFile.fromReadResult} */
  describe('.fromReadResult', function() {
    it('should fail without value', function() {
      expect(() => AtviseFile.fromReadResult({}), 'to throw', 'no value');
    });
  });

  /** @test {AtviseFile#_getMetadata} */
  describe('#_getMetadata', function() {
    tests.forEach(test => {
      it(test.name, function() {
        const file = new AtviseFile({ path: test.filePath });

        expect(() => file._getMetadata(), 'not to throw');
        expect(file._dataType, 'to equal', test.dataType);
        expect(file._arrayType, 'to equal', test.arrayType);
        expect(file._typeDefinition, 'to equal', test.typeDefinition);
      });
    });
  });

  function testMetaGetter(name) {
    beforeEach(() => stub(AtviseFile.prototype, '_getMetadata', () => {}));
    afterEach(() => AtviseFile.prototype._getMetadata.restore());

    it('should call _getMetadata if not present', function() {
      const file = new AtviseFile({ path: 'path' });
      const val = file[name];

      expect(val, 'to be', undefined);
      expect(AtviseFile.prototype._getMetadata.calledOnce, 'to be', true);
    });
  }

  /** @test {AtviseFile#dataType} */
  describe('#dataType', function() {
    testMetaGetter('dataType');
  });

  /** @test {AtviseFile#arrayType} */
  describe('#arrayType', function() {
    testMetaGetter('arrayType');
  });

  /** @test {AtviseFile#typeDefinition} */
  describe('#typeDefinition', function() {
    testMetaGetter('typeDefinition');
  });

  /** @test {AtviseFile#isDisplay} */
  describe('#isDisplay', function() {
    it('should return true for AtviseFiles with correct TypeDefinition', function() {
      expect((new AtviseFile({
        path: 'test.display',
        _typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
      })).isDisplay, 'to be true');
    });
  });

  /** @test {AtivseFile#value} */
  describe('#value', function() {
    const val = new Buffer('test');

    before(() => {
      stub(AtviseFile, 'decodeValue', () => true);
      stub(AtviseFile, 'encodeValue', () => val);
    });

    after(() => {
      AtviseFile.decodeValue.restore();
      AtviseFile.encodeValue.restore();
    });

    context('when used as getter', function() {
      it('should return decodedValue', function() {
        const file = new AtviseFile({ path: 'path.ext' });

        expect(file.value, 'to equal', true);
        expect(AtviseFile.decodeValue.calledOnce, 'to be true');
      });
    });

    context('when used as setter', function() {
      it('should set encoded value as contents', function() {
        const file = new AtviseFile({ path: 'path.ext' });
        file.value = 13;

        expect(AtviseFile.encodeValue.calledOnce, 'to be true');
        expect(file.contents, 'to equal', val);
      });
    });
  });

  /** @test {AtviseFile#nodeId} */
  describe('#nodeId', function() {
    it('should keep extensions for resources', function() {
      expect((new AtviseFile({ path: 'SYSTEM/LIBRARY/PROJECT/RESOURCES/example.js' }).nodeId.value),
        'to equal', 'SYSTEM.LIBRARY.PROJECT.RESOURCES/example.js');
    });
  });
});
