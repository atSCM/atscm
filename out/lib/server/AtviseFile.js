"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DataTypeForExtension = exports.ExtensionForDataType = void 0;

var _fs = require("fs");

var _path = require("path");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _variant = require("node-opcua/lib/datamodel/variant");

var _nodeid = require("node-opcua/lib/datamodel/nodeid");

var _localized_text = require("node-opcua/lib/datamodel/localized_text");

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _qualified_name = require("node-opcua/lib/datamodel/qualified_name");

var _datavalue = require("node-opcua/lib/datamodel/datavalue");

var _opcua_node_ids = require("node-opcua/lib/opcua_node_ids");

var _expanded_nodeid = require("node-opcua/lib/datamodel/expanded_nodeid");

var _diagnostic_info = require("node-opcua/lib/datamodel/diagnostic_info");

var _vinyl = _interopRequireDefault(require("vinyl"));

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _Object = require("../helpers/Object");

var _mapping = require("../helpers/mapping");

var _Types = _interopRequireWildcard(require("./Types"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A map of AtviseTypes against their definition id's value.
 * @type {Map<String, AtivseType>}
 */
const AtviseTypesByValue = _Types.default.reduce((result, type) => Object.assign(result, {
  [type.typeDefinition.value]: type
}), {});
/**
 * A map of AtviseTypes against their identifiers.
 * @type {Map<String, AtivseType>}
 */


const AtviseTypesByIdentifier = _Types.default.reduce((result, type) => Object.assign(result, {
  [type.identifier]: type
}), {});
/**
 * A map providing shorter extensions for data types
 * @type {Map<node-opcua~DataType, String>}
 */


const ExtensionForDataType = {
  [_variant.DataType.Boolean]: 'bool',
  [_variant.DataType.XmlElement]: 'xml'
};
/**
 * A map providing data types for shorter extensions (Reverse of {@link DataTypeForExtension}).
 * * @type {Map<String, node-opcua~DataType>}
 */

exports.ExtensionForDataType = ExtensionForDataType;
const DataTypeForExtension = (0, _Object.reverse)(ExtensionForDataType); // Cache DataType

/**
 * OPC-UA data type names.
 * @type {String[]}
 */

exports.DataTypeForExtension = DataTypeForExtension;
const types = Object.keys(_variant.DataType);
/**
 * OPC-UA data type extensions.
 * @type {String[]}
 */

const typeExtensions = types.map(t => t.toLowerCase()); // Cache TypeDefinitions

/**
 * Variable data type definition node id.
 * @type {NodeId}
 */

const VariableTypeDefinition = new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 62, 0);
/**
 * Property data type definition node id.
 * @type {NodeId}
 */

const PropertyTypeDefinition = new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 68, 0); // Cache Regular expressions

/**
 * A regular expression picking file extensions from file names.
 * @type {RegExp}
 */

const ExtensionRegExp = /\.([^/\\]*)$/;
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
 * Mapping functions that return serializable values for a node of the given
 * {@link node-opcua~DataType}.
 * @type {Map<node-opcua~DataType, function>}
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
    text,
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
    value: getRawValue(value, dataType, arrayType),
    // eslint-disable-line no-use-before-define
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
 * Returns a node's raw value based on it's OPC-UA value and type.
 * @param {*} value A node's OPC-UA value.
 * @param {node-opcua~DataType} dataType The node's data type.
 * @param {node-opcua~VariantArrayType} arrayType The node's array type.
 * @return {*} The raw value of the given node.
 */

const getRawValue = (value, dataType, arrayType) => {
  if (arrayType.value !== _variant.VariantArrayType.Scalar.value) {
    const array = Array.isArray(value) ? value : Array.from(value);
    return array.map(val => getRawValue(val, dataType, _variant.VariantArrayType[arrayType.value - 1]));
  }

  return (toRawValue[dataType] || asIs)(value);
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
 * Returns the extension for a specific {@link node-opcua~DataType}.
 * Algorithm:
 *   - if the type has a shortened extension defined in {@link ExtensionForDataType}, return it.
 *   - else return the DataType's name, in lowercase letters.
 * @param {node-opcua~DataType} dataType The datatype to get the extension for.
 * @return {string} The resulting extension.
 */


function extensionForDataType(dataType) {
  return ExtensionForDataType[dataType] || dataType.toString().toLowerCase();
}
/**
 * A regular expression that maches all reference definition files.
 * @type {RegExp}
 */


const ConfigFileRegexp = /^\.((Object|Variable)(Type)?|Method|View|(Reference|Data)Type)\.json$/;
/**
 * An extension to {@link vinyl~File} providing some additional, atvise-related properties.
 * @property {node-opcua~DataType} AtviseFile#dataType The {@link node-opcua~DataType} the node is
 * stored against on atvise server.
 * @property {NodeId} typeDefinition The file's type definition on atvise server.
 * FIXME: Additional properties not showing in API docs.
 */

class AtviseFile extends _vinyl.default {
  /**
   * Returns a storage path for a {@link ReadStream.ReadResult}.
   * @param {ReadStream.ReadResult} readResult The read result to get a path for.
   */
  static pathForReadResult(readResult) {
    let path = readResult.nodeId.filePath;

    if (readResult.nodeClass.value !== _nodeclass.NodeClass.Variable.value) {
      return `${path}/.${readResult.nodeClass.key}.json`;
    }

    const dataType = readResult.value.$dataType;
    const arrayType = readResult.value.$arrayType;
    const typeDefinition = readResult.references.HasTypeDefinition[0];

    if (typeDefinition.value === VariableTypeDefinition.value) {
      // Variable nodes are stored with their lowercase datatype as an extension
      path += `.${extensionForDataType(dataType)}`;
    } else if (typeDefinition.value === PropertyTypeDefinition.value) {
      // Property nodes are stored with ".prop" and their lowercase datatype as an extension
      path += `.prop.${extensionForDataType(dataType)}`;
    } else {
      // Handle custom types
      let identifier = 'var';
      let fileExtension = false;
      let keepExtension = false;
      const atType = AtviseTypesByValue[typeDefinition.value];

      if (atType) {
        identifier = atType.identifier;
        fileExtension = atType.fileExtension;
        keepExtension = atType.keepExtension;
      }

      if (!keepExtension) {
        path += `.${identifier}.${fileExtension || extensionForDataType(dataType)}`;
      }
    } // Add "array" or "matrix" extensions for corresponding array types


    if (arrayType.value !== _variant.VariantArrayType.Scalar.value) {
      path += `.${arrayType === _variant.VariantArrayType.Array ? 'array' : 'matrix'}`;
    }

    return path;
  }
  /**
   * Encodes a node's value to file contents.
   * @param {*} value The value to encode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to encode the value for.
   * @param {node-opcua~VariantArrayType} arrayType The files array type.
   * @return {?Buffer} The encoded file contents or null.
   */


  static encodeValue(value, dataType, arrayType) {
    if (value.value === null) {
      return Buffer.from('');
    }

    const rawValue = getRawValue(value.value, dataType, arrayType);

    if (rawValue instanceof Buffer) {
      return rawValue;
    }

    const stringify = a => a.toJSON ? a.toJSON() : JSON.stringify(a, null, '  ');

    const stringified = typeof rawValue === 'object' ? stringify(rawValue) : rawValue.toString().trim();
    return Buffer.from(stringified);
  }
  /**
   * Decodes a file's contents to a node's value.
   * @param {Buffer} buffer The file contents to decode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to decode the contents.
   * @param {node-opcua~VariantArrayType} arrayType The files array type.
   * @return {?*} The decoded node value or null.
   */


  static decodeValue(buffer, dataType, arrayType) {
    if (buffer === null || buffer.length === 0) {
      return null;
    }

    if (dataType === _variant.DataType.ByteString && arrayType === _variant.VariantArrayType.Scalar) {
      return buffer;
    }

    const rawValue = arrayType === _variant.VariantArrayType.Scalar ? (decodeRawValue[dataType] || asIs)(buffer) : JSON.parse(buffer.toString());
    return getNodeValue(rawValue, dataType, arrayType);
  }
  /**
   * As file mtimes do not support millisecond resolution these must be removed before storing
   * files.
   * @param {Date} date The original mtime.
   * @return {Date} The normalized mtime.
   */


  static normalizeMtime(date) {
    date.setMilliseconds(0);
    return date;
  }
  /**
   * Creates a new {@link AtviseFile} for the given {@link ReadStream.ReadResult}.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @return {AtviseFile} The resulting file.
   */


  static fromReadResult(readResult) {
    const {
      nodeClass,
      references,
      value,
      mtime
    } = readResult;

    if (nodeClass.value === _nodeclass.NodeClass.Variable.value && !value) {
      throw new Error('no value');
    }

    return new AtviseFile({
      path: AtviseFile.pathForReadResult(readResult),
      contents: value ? AtviseFile.encodeValue(value, value.$dataType, value.$arrayType) : // Variables
      Buffer.from(JSON.stringify({
        references: (0, _mapping.sortReferences)(references)
      }, null, '  ')),
      // Objects, types, ...
      _nodeClass: nodeClass,
      _dataType: value && value.$dataType,
      _arrayType: value && value.$arrayType,
      _references: references,
      stat: {
        mtime: mtime ? this.normalizeMtime(mtime) : undefined
      }
    });
  }
  /**
   * Recalculates {@link AtviseFile#dataType}, {@link AtviseFile#arrayType} and
   * {@link AtviseFile#typeDefinition}. **Never call this method directly.**.
   */


  _getMetadata() {
    if (this.stem[0] === '.') {
      // Got non-variable node

      /**
       * The node's class.
       * @type {node-opcua~NodeClass}
       */
      this._nodeClass = _nodeclass.NodeClass[this.stem.split('.')[1]];
      const {
        references = {}
      } = JSON.parse(this.contents.toString());
      /**
       * References the node holds: In most cases this will be a single entry for
       * `'HasTypeDefinition'`.
       * @type {Map<String, NodeId[]>}
       */

      this._references = Object.entries(references).reduce((result, [type, refs]) => Object.assign(result, {
        [type]: Array.isArray(refs) ? refs.map(v => new _NodeId.default(v)) : new _NodeId.default(refs)
      }), {});
      return;
    }

    this._nodeClass = _nodeclass.NodeClass.Variable; // Set default metadata

    /**
     * The node's stored {@link node-opcua~VariantArrayType}.
     * @type {?node-opcua~VariantArrayType}
     */

    this._arrayType = _variant.VariantArrayType.Scalar;
    this._references = {};
    /**
     * A node's browse- and display name.
     * @type {?string}
     */

    this._name = this.stem.split('.')[0];
    let extensions = [];
    const m = this.relative.match(ExtensionRegExp);

    if (m) {
      extensions = m[1].split('.');
    } // For split files, add the directory name extension


    const dirnameExts = this.dirname.split('.');

    if (dirnameExts.length > 1) {
      extensions.unshift(dirnameExts[dirnameExts.length - 1]);
    }

    function ifLastExtensionMatches(matches, fn) {
      if (matches(extensions[extensions.length - 1])) {
        fn(extensions.pop());
      }
    }

    const complete = () => this._dataType !== undefined && this._references.HasTypeDefinition !== undefined; // Handle array types


    ifLastExtensionMatches(ext => ext === 'array', () => {
      this._arrayType = _variant.VariantArrayType.Array;
    });
    ifLastExtensionMatches(ext => ext === 'matrix', () => {
      this._arrayType = _variant.VariantArrayType.Matrix;
    });
    ifLastExtensionMatches(ext => typeExtensions.includes(ext), ext => {
      /**
       * The node's stored {@link node-opcua~DataType}.
       * @type {?node-opcua~DataType}
       */
      this._dataType = _variant.DataType[types[typeExtensions.indexOf(ext)]];
    }); // Handle wrapped data types (e.g. "bool" for DataType.Boolean)

    ifLastExtensionMatches(ext => DataTypeForExtension[ext], ext => {
      this._dataType = _variant.DataType[DataTypeForExtension[ext]];
    });

    if (extensions.length === 0) {
      // Got variable

      /**
       * The node's stored type definition.
       * @type {?node-opcua~NodeId}
       */
      this._references.HasTypeDefinition = [new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 62, 0)];
    }

    ifLastExtensionMatches(ext => ext === 'prop', () => {
      this._references.HasTypeDefinition = [new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 68, 0)];
      this._references.toParent = _opcua_node_ids.ReferenceTypeIds.HasProperty;
    });
    ifLastExtensionMatches(ext => ext === 'var', () => {
      this._references.HasTypeDefinition = [new _NodeId.default('Custom.VarResourceType')];
    });

    if (!complete()) {
      // Handle atvise types
      let foundAtType = false;
      Object.entries(AtviseTypesByIdentifier).forEach(([identifier, type]) => {
        if (!foundAtType && extensions.includes(identifier)) {
          foundAtType = true;

          if (!(type instanceof _Types.AtviseResourceType)) {
            extensions = extensions.filter(e => e !== identifier);
          }

          this._references.HasTypeDefinition = [type.typeDefinition];
          this._dataType = type.dataType;
        }
      });
    }

    if (!complete()) {
      this._references.HasTypeDefinition = [new _NodeId.default('VariableTypes.ATVISE.Resource.OctetStream')];
      this._dataType = _variant.DataType.ByteString;
    }

    this._name = [this._name, ...extensions.filter(e => !dirnameExts.includes(e))].join('.');
  }
  /**
   * Computes a file's metadata if needed.
   * @return {AtviseFile} The file.
   */


  getMetadata() {
    if (!this._nodeClass) {
      this._getMetadata();
    }

    return this;
  }
  /**
   * The node's class.
   * @type {node-opcua~NodeClass}
   */


  get nodeClass() {
    if (!this._nodeClass) {
      this._getMetadata();
    }

    return this._nodeClass;
  }
  /**
   * The file's {@link node-opcua~DataType}.
   * @type {node-opcua~DataType}
   */


  get dataType() {
    if (!this._dataType) {
      this._getMetadata();
    }

    return this._dataType;
  }
  /**
   * The file's {@link node-opcua~VariantArrayType}.
   * @type {node-opcua~VariantArrayType}
   */


  get arrayType() {
    if (!this._arrayType) {
      this._getMetadata();
    }

    return this._arrayType;
  }
  /**
   * The files's references.
   * @type {Map<string, NodeId|NodeId[]>}
   */


  get references() {
    if (!this._references) {
      this._getMetadata();
    }

    return this._references;
  }
  /**
   * The file's type definition.
   * @type {node-opcua~NodeId}
   */


  get typeDefinition() {
    const refs = this.references;

    if (refs && refs.HasTypeDefinition) {
      return refs.HasTypeDefinition[0];
    }

    return new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 0, 0);
  } // eslint-disable-next-line jsdoc/require-description-complete-sentence

  /**
   * `true` for reference config files (for example `.index.htm.json`).
   * @type {boolean}
   */


  get isReferenceConfig() {
    return this.stem[0] === '.' && !this.stem.match(ConfigFileRegexp);
  }
  /**
   * `true` for files containing atvise displays.
   * @type {boolean}
   */


  get isDisplay() {
    return this.typeDefinition.value === 'VariableTypes.ATVISE.Display';
  }
  /**
   * `true` for files containing atvise scripts.
   * @type {boolean}
   */


  get isScript() {
    return this.typeDefinition.value === 'VariableTypes.ATVISE.ScriptCode';
  }
  /**
   * `true` for files containing atvise quick dynamics.
   * @type {boolean}
   */


  get isQuickDynamic() {
    return this.typeDefinition.value === 'VariableTypes.ATVISE.QuickDynamic';
  }
  /**
   * Sets the node value for the file.
   * @param {?*} newValue The value to set.
   */


  set value(newValue) {
    /**
     * The file's contents.
     * @type {?Buffer}
     */
    this.contents = AtviseFile.encodeValue(newValue, this.dataType, this.arrayType);
  }
  /**
   * Returns the decoded node value for the file.
   * @type {?*} The file's decoded value.
   */


  get value() {
    return AtviseFile.decodeValue(this.contents, this.dataType, this.arrayType);
  }
  /**
   * Returns the decoded node value for create node serverscript.
   * @type {?*} The file's decoded value.
   */


  get createNodeValue() {
    const value = this.value;

    if (this.dataType === _variant.DataType.DateTime) {
      return value.valueOf();
    }

    if (value instanceof Buffer) {
      return value.toString();
    }

    return value;
  }
  /**
   * Returns the node id associated with the file.
   * @type {NodeId} The file's node id.
   */


  get nodeId() {
    if (this.nodeClass.value !== _nodeclass.NodeClass.Variable.value) {
      return _NodeId.default.fromFilePath((0, _path.dirname)(this.relative));
    }

    const atType = AtviseTypesByValue[this.typeDefinition.value];
    let idPath = this.relative;

    if (!atType || !atType.keepExtension) {
      const exts = idPath.match(ExtensionRegExp)[1];
      idPath = idPath.split(`.${exts}`)[0];
    }

    return _NodeId.default.fromFilePath(idPath);
  }
  /**
   * A file's browse and display name.
   * @type {string}
   */


  get name() {
    if (!this._name) {
      this._getMetadata();
    }

    return this._name;
  }
  /**
   * A file's parent's node id.
   * @type {NodeId}
   */


  get parentNodeId() {
    const name = this.name;
    const id = this.nodeId;

    if (name) {
      const parts = this.nodeId.value.split(name);

      if (parts.length > 1) {
        return new _NodeId.default(id.identifierType, parts[0].slice(0, -1), id.namespaceIndex);
      }
    }

    return this.nodeId.parent;
  }
  /**
   * Returns a new file with all attributes of the current file.
   * @param {Object} options See the {@link vinyl~File} docs for all options available.
   * @return {AtviseFile} The cloned file.
   * @see https://github.com/gulpjs/vinyl#filecloneoptions
   */


  clone(options) {
    const clonedFile = super.clone(options);
    clonedFile._nodeClass = this._nodeClass;
    clonedFile._dataType = this._dataType;
    clonedFile._arrayType = this._arrayType;
    clonedFile._references = this._references;
    return clonedFile;
  }
  /**
   * Creates a new AtviseFile and reads it's contents.
   * @param {Object} options See {@link vinyl~File} for available options.
   * @return {Promise} Resolved with the new file of rejected with the error that occured while
   * trying to read it's path.
   */


  static read(options = {}) {
    return new Promise((resolve, reject) => {
      if (!options.path) {
        reject(new Error('options.path is required'));
      } else {
        (0, _fs.readFile)(options.path, (err, contents) => {
          if (err) {
            reject(err);
          } else {
            resolve(new AtviseFile(Object.assign(options, {
              contents
            })));
          }
        });
      }
    });
  }

}

exports.default = AtviseFile;
//# sourceMappingURL=AtviseFile.js.map