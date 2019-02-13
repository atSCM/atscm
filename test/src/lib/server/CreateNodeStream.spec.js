import {
  DataType,
  NodeClass,
  Variant,
  VariantArrayType,
  StatusCodes,
  NodeId as OpcNodeId,
} from 'node-opcua';
import { spy } from 'sinon';
import Logger from 'gulplog';
import expect from '../../../expect';
import CreateNodeStream from '../../../../src/lib/server/CreateNodeStream';
import AtviseFile from '../../../../src/lib/server/AtviseFile';
import Session from '../../../../src/lib/server/Session';
import NodeId from '../../../../src/lib/model/opcua/NodeId';
import { FileNode } from '../../../../src/lib/gulp/src';

/** @test {CreateNodeStream} */
describe('CreateNodeStream', function() {
  /** @test {CreateNodeStream#scriptId} */
  describe('#scriptId', function() {
    it('should return the atscm CreateNode script', function() {
      return expect((new CreateNodeStream()).scriptId, 'to equal',
        new NodeId('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode'));
    });
  });

  /** @test {CreateNodeStream#scriptParameters} */
  describe('#scriptParameters', function() {
    it.skip('should return a single JSON encoded parameter', function() {
      const file = new FileNode({
        name: 'Test',
        parent: null,
        nodeClass: 'Variable',
        nodeId: 'AGENT.OBJECTS.Testing',
        referneces: {
          HasTypeDefinition: 'VariableTypes.Project.Test',
        },
        dataType: DataType.String,
        arrayType: VariantArrayType.Scalar,
      });

      this.value.value = 'Just testing...';

      const params = (new CreateNodeStream()).scriptParameters(file);

      expect(params, 'to only have keys', ['paramObjString']);
      expect(params.paramObjString, 'to only have keys', ['dataType', 'value']);
      expect(params.paramObjString.dataType, 'to equal', DataType.String);
      expect(params.paramObjString.value, 'to be a string');
      expect(() => JSON.parse(params.paramObjString.value), 'not to throw');
    });

    it.skip('should include nodeId, parentNodeId, nodeClass, typeDefinition and browseName', () => {
      const typeDefId = new NodeId('Type.Def.Id');
      const file = new AtviseFile({
        path: './src/path/to/node/.Object.json',
        base: './src/',
        contents: Buffer.from(JSON.stringify({
          references: {
            HasTypeDefinition: [
              typeDefId,
            ],
          },
        })),
      });

      const params = (new CreateNodeStream()).scriptParameters(file);
      const decoded = JSON.parse(params.paramObjString.value);

      expect(decoded.nodeId, 'to equal', 'ns=1;s=path.to.node');
      expect(decoded.parentNodeId, 'to equal', 'ns=1;s=path.to');
      expect(decoded.nodeClass, 'to equal', NodeClass.Object.value);
      expect(decoded.typeDefinition, 'to equal', typeDefId.value);
      expect(decoded.browseName, 'to equal', 'node');
      expect(decoded.dataType, 'to be undefined');
      expect(decoded.valueRank, 'to be undefined');
      expect(decoded.value, 'to be undefined');
    });

    it.skip('should include dataType, arrayType and value for variables', function() {
      const file = new AtviseFile({
        path: './src/AGENT/OBJECTS/Test.prop.float.array',
        base: './src/',
        contents: Buffer.from('[0.13,14]'),
      });

      const params = (new CreateNodeStream()).scriptParameters(file);
      const decoded = JSON.parse(params.paramObjString.value);

      expect(decoded.nodeId, 'to equal', 'ns=1;s=AGENT.OBJECTS.Test');
      expect(decoded.parentNodeId, 'to equal', 'ns=1;s=AGENT.OBJECTS');
      expect(decoded.nodeClass, 'to equal', NodeClass.Variable.value);
      expect(decoded.typeDefinition, 'to equal', 68); // Property
      expect(decoded.browseName, 'to equal', 'Test');
      expect(decoded.dataType, 'to equal', DataType.Float.value);
      expect(decoded.valueRank, 'to equal', VariantArrayType.Array.value);
      expect(decoded.value, 'to equal', [0.13, 14]);
    });
  });

  /** @test {CreateNodeStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should tell which node failed to create', function() {
      return expect(CreateNodeStream.prototype.processErrorMessage,
        'when called with', [{ nodeId: new NodeId('Failed.to.create') }],
        'to match', /creating node/i);
    });
  });

  /** @test {CreateNodeStream#handleOutputArguments} */
  describe('#handleOutputArguments', function() {
    it('should forward script errors', function() {
      const stream = new CreateNodeStream();

      return expect(cb => stream.handleOutputArguments({},
        [
          { value: StatusCodes.Bad },
          { value: 'Test error' },
        ], cb),
      'to call the callback with error', 'Test error');
    });

    it('should warn if creating the node failed', async function() {
      const stream = new CreateNodeStream();

      const warnSpy = spy();
      Logger.on('warn', warnSpy);

      await expect(cb => stream.handleOutputArguments({ nodeId: 'Test' },
        [
          { value: StatusCodes.Good },
          {},
          {},
          { value: [{ value: false }, { value: true }] },
        ], cb),
      'to call the callback without error');

      expect(warnSpy, 'was called once');
      return expect(warnSpy, 'to have a call satisfying', { args: [/Failed to create.*Test/] });
    });

    it('should log if a node was created', async function() {
      const stream = new CreateNodeStream();

      const debugSpy = spy();
      Logger.on('debug', debugSpy);

      await expect(cb => stream.handleOutputArguments({ nodeId: 'Test' },
        [
          { value: StatusCodes.Good },
          {},
          {},
          { value: [{ value: true }, { value: false }] },
        ], cb),
      'to call the callback without error');

      expect(debugSpy, 'was called once');
      return expect(debugSpy, 'to have a call satisfying', { args: [/Created node.*Test/] });
    });

    it.skip('should log if node already existed', async function() {
      const stream = new CreateNodeStream();

      const debugSpy = spy();
      Logger.on('debug', debugSpy);

      await expect(cb => stream.handleOutputArguments({ nodeId: 'Test' },
        [
          { value: StatusCodes.Good },
          {},
          {},
          { value: [{ value: false }, { value: false }] },
        ], cb),
      'to call the callback without error');

      expect(debugSpy, 'was called once');
      return expect(debugSpy, 'to have a call satisfying', { args: [/already exists/] });
    });
  });

  /** @test {CreateNodeStream#processChunk} */
  describe.skip('#processChunk', function() {
    const testTime = Date.now();
    const testFolderNodePath = `src/AGENT/OBJECTS/TestCreate-${testTime}`;
    const nodeIdBase = `AGENT.OBJECTS.TestCreate-${testTime}`;

    before('create test node folder', function() {
      const stream = new CreateNodeStream();

      return expect([new FileNode({
        path: `${testFolderNodePath}/.Object.json`,
        base: './src',
        contents: Buffer.from(JSON.stringify({
          references: {
            HasTypeDefinition: [
              'ns=0;i=61',
            ],
          },
        })),
      })], 'when piped through', stream, 'to yield objects satisfying', 'to have length', 1);
    });

    const dateValue = new Date();
    dateValue.setMilliseconds(0);

    const tests = [
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: true,
          dataType: DataType.Boolean,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: 3,
          dataType: DataType.Int16,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: 1.0,
          dataType: DataType.Float,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: 'Test',
          dataType: DataType.String,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: dateValue,
          dataType: DataType.DateTime,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><test />',
          dataType: DataType.XmlElement,
          arrayType: VariantArrayType.Scalar,
        },
      },
      {
        nodeClass: NodeClass.Variable,
        value: {
          value: new OpcNodeId(NodeId.NodeIdType.STRING, 'Testing'),
          dataType: DataType.NodeId,
          arrayType: VariantArrayType.Scalar,
        },
      },
    ];

    tests.forEach(({ nodeClass, value }) => {
      it(`should be able to create ${value.dataType.key} ${nodeClass.key}s`, async function() {
        const stream = new CreateNodeStream();

        const nodeId = new NodeId(`${nodeIdBase}.Test${value.dataType.key}`);

        const variant = new Variant(value);

        expect(variant.isValid(), 'to be', true);

        const file = AtviseFile.fromReadResult({
          nodeId,
          nodeClass,
          value: variant,
          mtime: new Date(),
          references: {
            HasTypeDefinition: [
              new NodeId('ns=0;i=62'),
            ],
          },
        });

        await expect([file], 'when piped through', stream, 'to yield objects satisfying', [file]);

        const session = await Session.create();

        const [[{ value: readValue }]] = await expect(
          cb => session.readVariableValue([nodeId.toString()], cb),
          'to call the callback without error'
        );

        expect(readValue, 'to equal', variant);
      });
    });
  });
});
