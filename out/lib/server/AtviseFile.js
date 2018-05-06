'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataTypeForExtension = exports.ExtensionForDataType = undefined;

var _fs = require('fs');

var _path = require('path');

var _nodeOpcua = require('node-opcua');

var _expanded_nodeid = require('node-opcua/lib/datamodel/expanded_nodeid');

var _diagnostic_info = require('node-opcua/lib/datamodel/diagnostic_info');

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _NodeId = require('../model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _Object = require('../helpers/Object');

var _Types = require('./Types');

var _Types2 = _interopRequireDefault(_Types);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A map of AtviseTypes against their definition id's value.
 * @type {Map<String, AtivseType>}
 */
const AtviseTypesByValue = _Types2.default.reduce((result, type) => Object.assign(result, {
  [type.typeDefinition.value]: type
}), {});

/**
 * A map of AtviseTypes against their identifiers.
 * @type {Map<String, AtivseType>}
 */
const AtviseTypesByIdentifier = _Types2.default.reduce((result, type) => Object.assign(result, {
  [type.identifier]: type
}), {});

/**
 * A map providing shorter extensions for data types
 * @type {Map<node-opcua~DataType, String>}
 */
const ExtensionForDataType = exports.ExtensionForDataType = {
  [_nodeOpcua.DataType.Boolean]: 'bool',
  [_nodeOpcua.DataType.XmlElement]: 'xml'
};

/**
 * A map providing data types for shorter extensions (Reverse of {@link DataTypeForExtension}).
 * * @type {Map<String, node-opcua~DataType>}
 */
const DataTypeForExtension = exports.DataTypeForExtension = (0, _Object.reverse)(ExtensionForDataType);

// Cache DataType
/**
 * OPC-UA data type names.
 * @type {String[]}
 */
const types = Object.keys(_nodeOpcua.DataType);

/**
 * OPC-UA data type extensions.
 * @type {String[]}
 */
const typeExtensions = types.map(t => t.toLowerCase());

// Cache TypeDefinitions
/**
 * Variable data type definition node id.
 * @type {NodeId}
 */
const VariableTypeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 62, 0);
/**
 * Property data type definition node id.
 * @type {NodeId}
 */
const PropertyTypeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 68, 0);

// Cache Regular expressions
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
  [_nodeOpcua.DataType.Null]: () => null,
  [_nodeOpcua.DataType.StatusCode]: ({ name }) => name,
  [_nodeOpcua.DataType.QualifiedName]: ({ namespaceIndex, name }) => ({ namespaceIndex, name }),
  [_nodeOpcua.DataType.LocalizedText]: ({ text, locale }) => ({ text, locale }),
  [_nodeOpcua.DataType.DataValue]: value => {
    const options = (0, _Object.pick)(value, ['value', 'statusCode', 'sourceTimestamp', 'sourcePicoseconds', 'serverTimestamp', 'serverPicoseconds']);

    mapPropertyAs(toRawValue, options, 'value', _nodeOpcua.DataType.Variant);
    mapPropertyAs(toRawValue, options, 'statusCode', _nodeOpcua.DataType.StatusCode);
    // NOTE: server- and sourceTimstamps get mapped as dates

    return options;
  },
  [_nodeOpcua.DataType.Variant]: ({ dataType, arrayType, value, dimensions }) => ({
    dataType,
    arrayType,
    value: getRawValue(value, dataType, arrayType), // eslint-disable-line no-use-before-define
    dimensions
  }),
  [_nodeOpcua.DataType.DiagnosticInfo]: info => {
    const options = (0, _Object.pick)(info, ['namespaceUri', 'symbolicId', 'locale', 'localizedText', 'additionalInfo', 'innerStatusCode', 'innerDiagnosticInfo']);

    mapPropertyAs(toRawValue, options, 'innerStatusCode', _nodeOpcua.DataType.StatusCode);
    mapPropertyAs(toRawValue, options, 'innerDiagnosticInfo', _nodeOpcua.DataType.DiagnosticInfo);

    return options;
  }
};

/**
 * Decodes a buffer to a string.
 * @param {Buffer} b The buffer to decode from.
 * @return {string} The buffer's string representation.
 */
const decodeAsString = b => b.toString();

/**
 * Decodes a buffer to an integer value.
 * @param {Buffer} b The buffer to decode from.
 * @return {number} The decoded integer.
 */
const decodeAsInt = b => parseInt(b.toString(), 10);

/**
 * Decodes a buffer to a float value.
 * @param {Buffer} b The buffer to decode from.
 * @return {number} The decoded float.
 */
const decodeAsFloat = b => parseFloat(b.toString());

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
  [_nodeOpcua.DataType.Null]: () => null,
  [_nodeOpcua.DataType.Boolean]: b => b.toString() === 'true',
  [_nodeOpcua.DataType.SByte]: decodeAsInt,
  [_nodeOpcua.DataType.Byte]: decodeAsInt,
  [_nodeOpcua.DataType.Int16]: decodeAsInt,
  [_nodeOpcua.DataType.UInt16]: decodeAsInt,
  [_nodeOpcua.DataType.Int32]: decodeAsInt,
  [_nodeOpcua.DataType.UInt32]: decodeAsInt,
  [_nodeOpcua.DataType.Int64]: decodeAsJson,
  [_nodeOpcua.DataType.UInt64]: decodeAsJson,
  [_nodeOpcua.DataType.Float]: decodeAsFloat,
  [_nodeOpcua.DataType.Double]: decodeAsFloat,
  [_nodeOpcua.DataType.String]: decodeAsString,
  [_nodeOpcua.DataType.DateTime]: decodeAsString,
  [_nodeOpcua.DataType.Guid]: decodeAsString,
  // ByteString maps to Buffer
  [_nodeOpcua.DataType.XmlElement]: decodeAsString,
  [_nodeOpcua.DataType.NodeId]: decodeAsString,
  [_nodeOpcua.DataType.ExpandedNodeId]: decodeAsString,
  [_nodeOpcua.DataType.StatusCode]: decodeAsString,
  [_nodeOpcua.DataType.QualifiedName]: decodeAsJson,
  [_nodeOpcua.DataType.LocalizedText]: decodeAsJson,
  // FIXME: Add ExtensionObject
  [_nodeOpcua.DataType.DataValue]: decodeAsJson,
  [_nodeOpcua.DataType.Variant]: decodeAsJson,
  [_nodeOpcua.DataType.DiagnosticInfo]: decodeAsJson
};

/**
 * Mapping functions that return OPC-UA node values for raw values.
 * @type {Map<node-opcua~DataType, function>}
 */
const toNodeValue = {
  [_nodeOpcua.DataType.DateTime]: s => new Date(s),
  [_nodeOpcua.DataType.ByteString]: b => {
    if (b instanceof Buffer) {
      return b;
    }

    return Buffer.from(b.data, 'binary');
  },
  [_nodeOpcua.DataType.NodeId]: s => (0, _nodeOpcua.resolveNodeId)(s),

  // Jep, node-opcua does not provide a resolve function for expanded nodeids
  [_nodeOpcua.DataType.ExpandedNodeId]: s => {
    const nodeId = (0, _nodeOpcua.resolveNodeId)(s);
    const [value, ...defs] = nodeId.value.split(';');

    const { identifierType, namespace, namespaceUri, serverIndex } = defs.reduce((opts, def) => {
      const match = def.match(/^([^:]+):(.*)/);
      if (!match) {
        return opts;
      }

      let [key, val] = match.slice(1); // eslint-disable-line prefer-const

      if (key === 'serverIndex') {
        val = parseInt(val, 10);
      }

      return Object.assign(opts, { [key]: val });
    }, Object.assign({}, nodeId));

    return new _expanded_nodeid.ExpandedNodeId(identifierType, value, namespace, namespaceUri, serverIndex);
  },

  [_nodeOpcua.DataType.StatusCode]: name => _nodeOpcua.StatusCodes[name],
  [_nodeOpcua.DataType.QualifiedName]: options => new _nodeOpcua.QualifiedName(options),
  [_nodeOpcua.DataType.LocalizedText]: options => new _nodeOpcua.LocalizedText(options),
  [_nodeOpcua.DataType.DataValue]: options => {
    const opts = options;

    mapPropertyAs(toNodeValue, opts, 'value', _nodeOpcua.DataType.Variant);
    mapPropertyAs(toNodeValue, opts, 'statusCode', _nodeOpcua.DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'sourceTimestamp', _nodeOpcua.DataType.DateTime);
    mapPropertyAs(toNodeValue, opts, 'serverTimestamp', _nodeOpcua.DataType.DateTime);

    return new _nodeOpcua.DataValue(opts);
  },
  [_nodeOpcua.DataType.Variant]: ({ dataType, arrayType, value, dimensions }) => new _nodeOpcua.Variant({
    dataType,
    arrayType: _nodeOpcua.VariantArrayType[arrayType],
    value,
    dimensions
  }),
  [_nodeOpcua.DataType.DiagnosticInfo]: options => {
    const opts = options;

    mapPropertyAs(toNodeValue, opts, 'innerStatusCode', _nodeOpcua.DataType.StatusCode);
    mapPropertyAs(toNodeValue, opts, 'innerDiagnosticInfo', _nodeOpcua.DataType.DiagnosticInfo);

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
  if (arrayType.value !== _nodeOpcua.VariantArrayType.Scalar.value) {
    return value.map(val => getRawValue(val, dataType, _nodeOpcua.VariantArrayType[arrayType.value - 1]));
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
  if (arrayType.value !== _nodeOpcua.VariantArrayType.Scalar.value) {
    return rawValue.map(raw => getNodeValue(raw, dataType, _nodeOpcua.VariantArrayType[arrayType.value - 1]));
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
class AtviseFile extends _vinyl2.default {

  /**
   * Returns a storage path for a {@link ReadStream.ReadResult}.
   * @param {ReadStream.ReadResult} readResult The read result to get a path for.
   */
  static pathForReadResult(readResult) {
    let path = readResult.nodeId.filePath;

    if (readResult.nodeClass.value !== _nodeOpcua.NodeClass.Variable.value) {
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
    }

    // Add "array" or "matrix" extensions for corresponding array types
    if (arrayType.value !== _nodeOpcua.VariantArrayType.Scalar.value) {
      path += `.${arrayType === _nodeOpcua.VariantArrayType.Array ? 'array' : 'matrix'}`;
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

    if (dataType === _nodeOpcua.DataType.ByteString && arrayType === _nodeOpcua.VariantArrayType.Scalar) {
      return buffer;
    }

    const rawValue = arrayType === _nodeOpcua.VariantArrayType.Scalar ? (decodeRawValue[dataType] || asIs)(buffer) : JSON.parse(buffer.toString());

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
    const { nodeClass, references, value, mtime } = readResult;

    if (nodeClass.value === _nodeOpcua.NodeClass.Variable.value && !value) {
      throw new Error('no value');
    }

    return new AtviseFile({
      path: AtviseFile.pathForReadResult(readResult),
      contents: value ? AtviseFile.encodeValue(value, value.$dataType, value.$arrayType) : // Variables
      Buffer.from(JSON.stringify({ references }, null, '  ')), // Objects, types, ...
      _nodeClass: nodeClass,
      _dataType: value && value.$dataType,
      _arrayType: value && value.$arrayType,
      _references: references,
      stat: { mtime: mtime ? this.normalizeMtime(mtime) : undefined }
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
      this._nodeClass = _nodeOpcua.NodeClass[this.stem.split('.')[1]];

      const { references = {} } = JSON.parse(this.contents.toString());

      /**
       * References the node holds: In most cases this will be a single entry for
       * `'HasTypeDefinition'`.
       * @type {Map<String, NodeId[]>}
       */
      this._references = Object.entries(references).reduce((result, [type, refs]) => Object.assign(result, {
        [type]: Array.isArray(refs) ? refs.map(v => new _NodeId2.default(v)) : new _NodeId2.default(refs)
      }), {});

      return;
    }

    this._nodeClass = _nodeOpcua.NodeClass.Variable;

    // Set default metadata
    /**
     * The node's stored {@link node-opcua~VariantArrayType}.
     * @type {?node-opcua~VariantArrayType}
     */
    this._arrayType = _nodeOpcua.VariantArrayType.Scalar;

    this._references = {};

    let extensions = [];
    const m = this.relative.match(ExtensionRegExp);
    if (m) {
      extensions = m[1].split('.');
    }

    // For split files, add the directory name extension
    const dirnameExts = this.dirname.split('.');
    if (dirnameExts.length > 1) {
      extensions.unshift(dirnameExts[dirnameExts.length - 1]);
    }

    function ifLastExtensionMatches(matches, fn) {
      if (matches(extensions[extensions.length - 1])) {
        fn(extensions.pop());
      }
    }

    const complete = () => this._dataType !== undefined && this._references.HasTypeDefinition !== undefined;

    // Handle array types
    ifLastExtensionMatches(ext => ext === 'array', () => {
      this._arrayType = _nodeOpcua.VariantArrayType.Array;
    });

    ifLastExtensionMatches(ext => ext === 'matrix', () => {
      this._arrayType = _nodeOpcua.VariantArrayType.Matrix;
    });

    ifLastExtensionMatches(ext => typeExtensions.includes(ext), ext => {
      /**
       * The node's stored {@link node-opcua~DataType}.
       * @type {?node-opcua~DataType}
       */
      this._dataType = _nodeOpcua.DataType[types[typeExtensions.indexOf(ext)]];
    });

    // Handle wrapped data types (e.g. "bool" for DataType.Boolean)
    ifLastExtensionMatches(ext => DataTypeForExtension[ext], ext => {
      this._dataType = _nodeOpcua.DataType[DataTypeForExtension[ext]];
    });

    if (extensions.length === 0) {
      // Got variable
      /**
       * The node's stored type definition.
       * @type {?node-opcua~NodeId}
       */
      this._references.HasTypeDefinition = [new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 62, 0)];
    }

    ifLastExtensionMatches(ext => ext === 'prop', () => {
      this._references.HasTypeDefinition = [new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 68, 0)];
    });

    ifLastExtensionMatches(ext => ext === 'var', () => {
      this._references.HasTypeDefinition = [new _NodeId2.default('Custom.VarResourceType')];
    });

    if (!complete()) {
      // Handle atvise types
      let foundAtType = false;

      Object.keys(AtviseTypesByIdentifier).forEach(identifier => {
        if (!foundAtType && extensions.includes(identifier)) {
          foundAtType = true;
          const type = AtviseTypesByIdentifier[identifier];

          this._references.HasTypeDefinition = [type.typeDefinition];
          this._dataType = type.dataType;
        }
      });
    }

    if (!complete()) {
      this._references.HasTypeDefinition = [new _NodeId2.default('VariableTypes.ATVISE.Resource.OctetStream')];
      this._dataType = _nodeOpcua.DataType.ByteString;
    }
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

    return new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 0, 0);
  }

  // eslint-disable-next-line jsdoc/require-description-complete-sentence
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

    if (this.dataType === _nodeOpcua.DataType.DateTime) {
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
    if (this.nodeClass.value !== _nodeOpcua.NodeClass.Variable.value) {
      return _NodeId2.default.fromFilePath((0, _path.dirname)(this.relative));
    }
    const atType = AtviseTypesByValue[this.typeDefinition.value];
    let idPath = this.relative;

    if (!atType || !atType.keepExtension) {
      const exts = idPath.match(ExtensionRegExp)[1];
      idPath = idPath.split(`.${exts}`)[0];
    }

    return _NodeId2.default.fromFilePath(idPath);
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
            resolve(new AtviseFile(Object.assign(options, { contents })));
          }
        });
      }
    });
  }

}
exports.default = AtviseFile;
//# sourceMappingURL=AtviseFile.js.map