import {
  DataType,
  NodeId,
  StatusCodes,
  Variant,
  VariantArrayType,
  NodeClass,
  LocalizedText,
  QualifiedName,
  DataValue,
} from 'node-opcua';
import { ExpandedNodeId } from 'node-opcua/lib/datamodel/expanded_nodeid';
import { DiagnosticInfo } from 'node-opcua/lib/datamodel/diagnostic_info';

export const samples = [
  {
    value: null,
    dataType: DataType.Null,
  },
  {
    value: true,
    dataType: DataType.Boolean,
  },
  {
    value: 127,
    dataType: DataType.SByte,
  },
  {
    value: 129,
    dataType: DataType.Byte,
  },
  {
    value: 32767,
    dataType: DataType.Int16,
  },
  {
    value: 32768,
    dataType: DataType.UInt16,
  },
  {
    value: 2147483647,
    dataType: DataType.Int32,
  },
  {
    value: 4294967295,
    dataType: DataType.UInt32,
  },
  {
    value: [2147483647, 2147483647],
    dataType: DataType.Int64,
  },
  {
    value: [4294967295, 4294967295],
    dataType: DataType.UInt64,
  },
  {
    value: -5.25,
    dataType: DataType.Float,
  },
  {
    value: -7.13,
    dataType: DataType.Double,
  },
  {
    value: 'Test',
    dataType: DataType.String,
  },
  {
    value: new Date(),
    dataType: DataType.DateTime,
  },
  {
    value: '01234567-89ab-cdef-0123-456789abcdef',
    dataType: DataType.Guid,
  },
  {
    value: Buffer.from('Test', 'binary'),
    dataType: DataType.ByteString,
  },
  {
    value: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><test />',
    dataType: DataType.XmlElement,
  },
  {
    value: new NodeId(NodeId.NodeIdType.STRING, 'Test'),
    dataType: DataType.NodeId,
  },
  {
    value: new ExpandedNodeId(NodeId.NodeIdType.STRING, 'Test', 1, 'http://test.com/', 13),
    dataType: DataType.ExpandedNodeId,
  },
  {
    value: StatusCodes.BadTimestampsToReturnInvalid,
    dataType: DataType.StatusCode,
  },
  {
    value: new QualifiedName({ namespaceIndex: 3, name: 'Test' }),
    dataType: DataType.QualifiedName,
  },
  {
    value: new LocalizedText({ locale: 'en', text: 'Test' }),
    dataType: DataType.LocalizedText,
  },
  /* {
    value: ???,
    dataType: DataType.ExtensionObject,
  }, */
  {
    value: new DataValue({
      value: new Variant({
        value: true,
        dataType: DataType.Boolean,
        arrayType: VariantArrayType.Scalar,
      }),
      statusCode: StatusCodes.BadTimestampsToReturnInvalid,
      sourceTimestamp: new Date(),
      sourcePicoseconds: 1234,
      serverTimestamp: new Date(),
      serverPicoseconds: 2345,
    }),
    dataType: DataType.DataValue,
  },
  {
    value: new Variant({
      value: true,
      dataType: DataType.Boolean,
      arrayType: VariantArrayType.Scalar,
    }),
    dataType: DataType.Variant,
  },
  {
    value: new DiagnosticInfo({
      namespaceUri: 13,
      symbolicId: 14,
      locale: 15,
      localizedText: 16,
      additionalInfo: 'Info...',
      innerStatusCode: StatusCodes.BadTimestampsToReturnInvalid,
      innerDiagnosticInfo: new DiagnosticInfo({
        additionalInfo: 'Inner...',
      }),
    }),
    dataType: DataType.DiagnosticInfo,
  },
].map((s) => Object.assign({ nodeClass: NodeClass.Variable }, s));

export const scalar = samples.map((s) => Object.assign({ arrayType: VariantArrayType.Scalar }, s));

export const array = samples.map((s) =>
  Object.assign({}, s, {
    arrayType: VariantArrayType.Array,
    value: [s.value, s.value],
  })
);

export const matrix = array.map((s) =>
  Object.assign({}, s, {
    arrayType: VariantArrayType.Matrix,
    value: [s.value, s.value],
  })
);

export const all = [...scalar, ...array, ...matrix];
