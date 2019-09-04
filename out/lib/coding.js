"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encodeVariant = encodeVariant;
exports.decodeVariant = decodeVariant;

var _variant = require("node-opcua/lib/datamodel/variant");

var _nodeid = require("node-opcua/lib/datamodel/nodeid");

var _localized_text = require("node-opcua/lib/datamodel/localized_text");

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _qualified_name = require("node-opcua/lib/datamodel/qualified_name");

var _datavalue = require("node-opcua/lib/datamodel/datavalue");

var _expanded_nodeid = require("node-opcua/lib/datamodel/expanded_nodeid");

var _diagnostic_info = require("node-opcua/lib/datamodel/diagnostic_info");

var _Object = require("./helpers/Object");

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
      [key]: map[dataType](obj[key])
    });
  }

  return obj;
};
/**
 * A set of functions that return raw values from {@link node-opcua~Variant} for specific
 * {@link node-opcua~DataType}s.
 * @type {Map<node-opcua~DataType, function(value: any): any>}
 */


const toRawValue = {
  [_variant.DataType.Null]: () => null,
  [_variant.DataType.StatusCode]: ({
    name
  }) => name,
  [_variant.DataType.QualifiedName]: ({
    namespaceIndex,
    name
  }) => ({
    namespaceIndex,
    name
  }),
  [_variant.DataType.LocalizedText]: ({
    text,
    locale
  }) => ({
    text: text || null,
    locale
  }),
  [_variant.DataType.DataValue]: value => {
    const options = (0, _Object.pick)(value, ['value', 'statusCode', 'sourceTimestamp', 'sourcePicoseconds', 'serverTimestamp', 'serverPicoseconds']);
    mapPropertyAs(toRawValue, options, 'value', _variant.DataType.Variant);
    mapPropertyAs(toRawValue, options, 'statusCode', _variant.DataType.StatusCode); // NOTE: server- and sourceTimstamps get mapped as dates

    return options;
  },
  [_variant.DataType.Variant]: ({
    dataType,
    arrayType,
    value,
    dimensions
  }) => ({
    dataType,
    arrayType,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    value: getRawValue({
      value,
      dataType,
      arrayType
    }),
    dimensions
  }),
  [_variant.DataType.DiagnosticInfo]: info => {
    const options = (0, _Object.pick)(info, ['namespaceUri', 'symbolicId', 'locale', 'localizedText', 'additionalInfo', 'innerStatusCode', 'innerDiagnosticInfo']);
    mapPropertyAs(toRawValue, options, 'innerStatusCode', _variant.DataType.StatusCode);
    mapPropertyAs(toRawValue, options, 'innerDiagnosticInfo', _variant.DataType.DiagnosticInfo);
    return options;
  }
};
/**
 * Returns the raw value for a {@link node-opcua~Variant}.
 * @param {node-opcua~Variant} variant The variant to convert.
 */

function getRawValue({
  value,
  dataType,
  arrayType
}) {
  if (arrayType !== _variant.VariantArrayType.Scalar) {
    return (Array.isArray(value) ? value : Array.from(value)).map(val => getRawValue({
      value: val,
      dataType,
      arrayType: _variant.VariantArrayType[arrayType.value - 1]
    }));
  }

  return (toRawValue[dataType] || asIs)(value);
}
/**
 * Returns a buffer containing a {@link node-opcua~Variant}s encoded value.
 * @param {node-opcua~Variant} variant The variant to encode.
 * @return {Buffer} A buffer containing the encoded value.
 */


function encodeVariant({
  value,
  dataType,
  arrayType
}) {
  if (value === null) {
    return Buffer.from([]);
  }

  const rawValue = getRawValue({
    value,
    dataType,
    arrayType
  });

  if (rawValue instanceof Buffer) {
    return rawValue;
  }

  const stringify = a => a.toJSON ? a.toJSON() : JSON.stringify(a, null, '  ');

  const stringified = typeof rawValue === 'object' ? stringify(rawValue) : rawValue.toString().trim();
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
  [_variant.DataType.Null]: () => null,
  [_variant.DataType.Boolean]: b => decodeAsString(b) === 'true',
  [_variant.DataType.SByte]: decodeAsInt,
  [_variant.DataType.Byte]: decodeAsInt,
  [_variant.DataType.Int16]: decodeAsInt,
  [_variant.DataType.UInt16]: decodeAsInt,
  [_variant.DataType.Int32]: decodeAsInt,
  [_variant.DataType.UInt32]: decodeAsInt,
  [_variant.DataType.Int64]: decodeAsJson,
  [_variant.DataType.UInt64]: decodeAsJson,
  [_variant.DataType.Float]: decodeAsFloat,
  [_variant.DataType.Double]: decodeAsFloat,
  [_variant.DataType.String]: decodeAsString,
  [_variant.DataType.DateTime]: decodeAsString,
  [_variant.DataType.Guid]: decodeAsString,
  // ByteString maps to Buffer
  [_variant.DataType.XmlElement]: decodeAsString,
  [_variant.DataType.NodeId]: decodeAsString,
  [_variant.DataType.ExpandedNodeId]: decodeAsString,
  [_variant.DataType.StatusCode]: decodeAsString,
  [_variant.DataType.QualifiedName]: decodeAsJson,
  [_variant.DataType.LocalizedText]: decodeAsJson,
  // FIXME: Add ExtensionObject
  [_variant.DataType.DataValue]: decodeAsJson,
  [_variant.DataType.Variant]: decodeAsJson,
  [_variant.DataType.DiagnosticInfo]: decodeAsJson
};
/**
 * Mapping functions that return OPC-UA node values for raw values.
 * @type {Map<node-opcua~DataType, function>}
 */

const toNodeValue = {
  [_variant.DataType.DateTime]: s => new Date(s),
  [_variant.DataType.ByteString]: b => {
    if (b instanceof Buffer) {
      return b;
    }

    return Buffer.from(b.data, 'binary');
  },
  [_variant.DataType.NodeId]: s => (0, _nodeid.resolveNodeId)(s),
  // Jep, node-opcua does not provide a resolve function for expanded nodeids
  [_variant.DataType.ExpandedNodeId]: s => {
    const nodeId = (0, _nodeid.resolveNodeId)(s);
    const [value, ...defs] = nodeId.value.split(';');
    const {
      identifierType,
      namespace,
      namespaceUri,
      serverIndex
    } = defs.reduce((opts, def) => {
      const match = def.match(/^([^:]+):(.*)/);

      if (!match) {
        return opts;
      }

      let [key, val] = match.slice(1); // eslint-disable-line prefer-const

      if (key === 'serverIndex') {
        val = parseInt(val, 10);
      }

      return Object.assign(opts, {
        [key]: val
      });
    }, Object.assign({}, nodeId));
    return new _expanded_nodeid.ExpandedNodeId(identifierType, value, namespace, namespaceUri, serverIndex);
  },
  [_variant.DataType.StatusCode]: name => _opcua_status_code.StatusCodes[name],
  [_variant.DataType.QualifiedName]: options => new _qualified_name.QualifiedName(options),
  [_variant.DataType.LocalizedText]: options => new _localized_text.LocalizedText(options),
  [_variant.DataType.DataValue]: options => {
    const opts = options;
    mapPropertyAs(toNodeValue, opts, 'value', _variant.DataType.Variant);
    mapPropertyAs(toNodeValue, opts, 'statusCode', _variant.DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'sourceTimestamp', _variant.DataType.DateTime);
    mapPropertyAs(toNodeValue, opts, 'serverTimestamp', _variant.DataType.DateTime);
    return new _datavalue.DataValue(opts);
  },
  [_variant.DataType.Variant]: ({
    dataType,
    arrayType,
    value,
    dimensions
  }) => new _variant.Variant({
    dataType,
    arrayType: _variant.VariantArrayType[arrayType],
    value,
    dimensions
  }),
  [_variant.DataType.DiagnosticInfo]: options => {
    const opts = options;
    mapPropertyAs(toNodeValue, opts, 'innerStatusCode', _variant.DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'innerDiagnosticInfo', _variant.DataType.DiagnosticInfo);
    return new _diagnostic_info.DiagnosticInfo(opts);
  }
};
/**
 * Returns a node's OPC-UA value based on it's raw value and type.
 * @param {*} rawValue A node's raw value.
 * @param {node-opcua~DataType} dataType A node's data type.
 * @param {node-opcua~VariantArrayType} arrayType A node's array type.
 */

const getNodeValue = (rawValue, dataType, arrayType) => {
  if (arrayType.value !== _variant.VariantArrayType.Scalar.value) {
    if (!Array.isArray(rawValue)) {
      throw new Error('Value is not an array');
    }

    return rawValue.map(raw => getNodeValue(raw, dataType, _variant.VariantArrayType[arrayType.value - 1]));
  }

  return (toNodeValue[dataType] || asIs)(rawValue);
};
/**
 * Returns a {@link node-opcua~Variant} from a Buffer with the given *dataType* and *arrayType*.
 * @param {Buffer} buffer The buffer to decode from.
 * @param {Object} options The options to use.
 * @param {node-opcua~DataType} options.dataType The data type to decode to.
 * @param {node-opcua~VariantArrayType} options.arrayType The array type to decode to.
 */


function decodeVariant(buffer, {
  dataType,
  arrayType
}) {
  if (buffer === null || buffer.length === 0) {
    return null;
  }

  if (dataType === _variant.DataType.ByteString && arrayType === _variant.VariantArrayType.Scalar) {
    return buffer;
  }

  const rawValue = arrayType === _variant.VariantArrayType.Scalar ? (decodeRawValue[dataType] || asIs)(buffer) : JSON.parse(buffer.toString());
  return getNodeValue(rawValue, dataType, arrayType);
}
//# sourceMappingURL=coding.js.map