import { DataType, VariantArrayType, Variant } from 'node-opcua/lib/datamodel/variant';
import { resolveNodeId } from 'node-opcua/lib/datamodel/nodeid';
import { LocalizedText } from 'node-opcua/lib/datamodel/localized_text';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { QualifiedName } from 'node-opcua/lib/datamodel/qualified_name';
import { DataValue } from 'node-opcua/lib/datamodel/datavalue';
import { ExpandedNodeId } from 'node-opcua/lib/datamodel/expanded_nodeid';
import { DiagnosticInfo } from 'node-opcua/lib/datamodel/diagnostic_info';
import { pick } from './helpers/Object';

/**
 * Function that returns the passed argument as is.
 * @param {*} b The input argument.
 * @return {*} The value passed.
 */
const asIs = b => b;

/**
 * Maps a single property of an object using the the mapper defined in *map* for the given
 * *dataType*.
 * @param {Map<node-opcua~DataType, function} map The mappings to use.
 * @param {Object} obj The object to process.
 * @param {string} key Name of the property to map.
 * @param {node-opcua~DataType} dataType The data type to map the property to.
 */
const mapPropertyAs = (map, obj, key, dataType) => {
  if (obj[key]) {
    return Object.assign(obj, {
      [key]: map[dataType](obj[key]),
    });
  }

  return obj;
};

const toRawValue = {
  [DataType.Null]: () => null,
  [DataType.StatusCode]: ({ name }) => name,
  [DataType.QualifiedName]: ({ namespaceIndex, name }) => ({ namespaceIndex, name }),
  [DataType.LocalizedText]: ({ text, locale }) => ({ text, locale }),
  [DataType.DataValue]: value => {
    const options = pick(value, ['value', 'statusCode', 'sourceTimestamp', 'sourcePicoseconds',
      'serverTimestamp', 'serverPicoseconds']);

    mapPropertyAs(toRawValue, options, 'value', DataType.Variant);
    mapPropertyAs(toRawValue, options, 'statusCode', DataType.StatusCode);
    // NOTE: server- and sourceTimstamps get mapped as dates

    return options;
  },
  [DataType.Variant]: ({ dataType, arrayType, value, dimensions }) => ({
    dataType,
    arrayType,
    value: getRawValue(value, dataType, arrayType), // eslint-disable-line no-use-before-define
    dimensions,
  }),
  [DataType.DiagnosticInfo]: info => {
    const options = pick(info, ['namespaceUri', 'symbolicId', 'locale', 'localizedText',
      'additionalInfo', 'innerStatusCode', 'innerDiagnosticInfo']);

    mapPropertyAs(toRawValue, options, 'innerStatusCode', DataType.StatusCode);
    mapPropertyAs(toRawValue, options, 'innerDiagnosticInfo', DataType.DiagnosticInfo);

    return options;
  },
};

export function getRawValue({ value, dataType, arrayType }) {
  if (arrayType !== VariantArrayType.Scalar) {
    return (Array.isArray(value) ? value : Array.from(value))
      .map(val => getRawValue({
        value: val,
        dataType,
        arrayType: VariantArrayType[arrayType.value - 1],
      }));
  }

  return (toRawValue[dataType] || asIs)(value);
}

export function encodeVariant({ value, dataType, arrayType }) {
  if (value === null) { return Buffer.from([]); }

  const rawValue = getRawValue({ value, dataType, arrayType });

  if (rawValue instanceof Buffer) {
    return rawValue;
  }

  const stringify = a => (a.toJSON ? a.toJSON() : JSON.stringify(a, null, '  '));

  const stringified = (typeof rawValue === 'object') ?
    stringify(rawValue) :
    rawValue.toString().trim();

  return Buffer.from(stringified);
}

/**
 * Decodes a buffer to a string.
 * @param {Buffer} b The buffer to decode from.
 * @return {string} The buffer's string representation.
 */
const decodeAsString = b => b.toString().trim();

/**
 * Decodes a buffer to an integer value.
 * @param {Buffer} b The buffer to decode from.
 * @return {number} The decoded integer.
 */
const decodeAsInt = b => parseInt(decodeAsString(b), 10);

/**
 * Decodes a buffer to a float value.
 * @param {Buffer} b The buffer to decode from.
 * @return {number} The decoded float.
 */
const decodeAsFloat = b => parseFloat(decodeAsString(b));

/**
 * Decodes a buffer using JSON.
 * @param {Buffer} b The buffer to decode from.
 * @return {*} The decoded value, most likely an Object.
 */
const decodeAsJson = b => JSON.parse(b.toString());

/**
 * Mapping functions that return raw values for a stored value of the given type.
 * @type {Map<node-opcua~DataType, function>}
 */
const decodeRawValue = {
  [DataType.Null]: () => null,
  [DataType.Boolean]: b => decodeAsString(b) === 'true',
  [DataType.SByte]: decodeAsInt,
  [DataType.Byte]: decodeAsInt,
  [DataType.Int16]: decodeAsInt,
  [DataType.UInt16]: decodeAsInt,
  [DataType.Int32]: decodeAsInt,
  [DataType.UInt32]: decodeAsInt,
  [DataType.Int64]: decodeAsJson,
  [DataType.UInt64]: decodeAsJson,
  [DataType.Float]: decodeAsFloat,
  [DataType.Double]: decodeAsFloat,
  [DataType.String]: decodeAsString,
  [DataType.DateTime]: decodeAsString,
  [DataType.Guid]: decodeAsString,
  // ByteString maps to Buffer
  [DataType.XmlElement]: decodeAsString,
  [DataType.NodeId]: decodeAsString,
  [DataType.ExpandedNodeId]: decodeAsString,
  [DataType.StatusCode]: decodeAsString,
  [DataType.QualifiedName]: decodeAsJson,
  [DataType.LocalizedText]: decodeAsJson,
  // FIXME: Add ExtensionObject
  [DataType.DataValue]: decodeAsJson,
  [DataType.Variant]: decodeAsJson,
  [DataType.DiagnosticInfo]: decodeAsJson,
};

/**
 * Mapping functions that return OPC-UA node values for raw values.
 * @type {Map<node-opcua~DataType, function>}
 */
const toNodeValue = {
  [DataType.DateTime]: s => new Date(s),
  [DataType.ByteString]: b => {
    if (b instanceof Buffer) { return b; }

    return Buffer.from(b.data, 'binary');
  },
  [DataType.NodeId]: s => resolveNodeId(s),

  // Jep, node-opcua does not provide a resolve function for expanded nodeids
  [DataType.ExpandedNodeId]: s => {
    const nodeId = resolveNodeId(s);
    const [value, ...defs] = nodeId.value.split(';');

    const { identifierType, namespace, namespaceUri, serverIndex } = defs.reduce((opts, def) => {
      const match = def.match(/^([^:]+):(.*)/);
      if (!match) { return opts; }

      let [key, val] = match.slice(1); // eslint-disable-line prefer-const

      if (key === 'serverIndex') {
        val = parseInt(val, 10);
      }

      return Object.assign(opts, { [key]: val });
    }, Object.assign({}, nodeId));

    return new ExpandedNodeId(identifierType, value, namespace, namespaceUri, serverIndex);
  },

  [DataType.StatusCode]: name => StatusCodes[name],
  [DataType.QualifiedName]: options => new QualifiedName(options),
  [DataType.LocalizedText]: options => new LocalizedText(options),
  [DataType.DataValue]: options => {
    const opts = options;

    mapPropertyAs(toNodeValue, opts, 'value', DataType.Variant);
    mapPropertyAs(toNodeValue, opts, 'statusCode', DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'sourceTimestamp', DataType.DateTime);
    mapPropertyAs(toNodeValue, opts, 'serverTimestamp', DataType.DateTime);

    return new DataValue(opts);
  },
  [DataType.Variant]: ({ dataType, arrayType, value, dimensions }) => new Variant({
    dataType,
    arrayType: VariantArrayType[arrayType],
    value,
    dimensions,
  }),
  [DataType.DiagnosticInfo]: options => {
    const opts = options;

    mapPropertyAs(toNodeValue, opts, 'innerStatusCode', DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'innerDiagnosticInfo', DataType.DiagnosticInfo);

    return new DiagnosticInfo(opts);
  },
};

/**
 * Returns a node's OPC-UA value based on it's raw value and type.
 * @param {*} rawValue A node's raw value.
 * @param {node-opcua~DataType} dataType A node's data type.
 * @param {node-opcua~VariantArrayType} arrayType A node's array type.
 */
const getNodeValue = (rawValue, dataType, arrayType) => {
  if (arrayType.value !== VariantArrayType.Scalar.value) {
    if (!Array.isArray(rawValue)) {
      throw new Error('Value is not an array');
    }

    return rawValue.map(raw => getNodeValue(raw, dataType, VariantArrayType[arrayType.value - 1]));
  }

  return (toNodeValue[dataType] || asIs)(rawValue);
};

export function decodeVariant(buffer, { dataType, arrayType }) { // Variant misses "value" here
  if (buffer === null || buffer.length === 0) {
    return null;
  }

  if (dataType === DataType.ByteString && arrayType === VariantArrayType.Scalar) {
    return buffer;
  }

  const rawValue = arrayType === VariantArrayType.Scalar ?
    (decodeRawValue[dataType] || asIs)(buffer) :
    JSON.parse(buffer.toString());

  return getNodeValue(rawValue, dataType, arrayType);
}
