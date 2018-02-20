import { readFile } from 'fs';
import { dirname } from 'path';
import { NodeClass, DataType, VariantArrayType, resolveNodeId } from 'node-opcua';
import File from 'vinyl';
import NodeId from '../model/opcua/NodeId';
import { reverse } from '../helpers/Object';
import AtviseTypes from './Types';

/**
 * A map of AtviseTypes against their definition id's value.
 * @type {Map<String, AtivseType>}
 */
const AtviseTypesByValue = AtviseTypes
  .reduce((result, type) => Object.assign(result, {
    [type.typeDefinition.value]: type,
  }), {});

/**
 * A map of AtviseTypes against their identifiers.
 * @type {Map<String, AtivseType>}
 */
const AtviseTypesByIdentifier = AtviseTypes
  .reduce((result, type) => Object.assign(result, {
    [type.identifier]: type,
  }), {});

/**
 * A map providing shorter extensions for data types
 * @type {Map<node-opcua~DataType, String>}
 */
export const ExtensionForDataType = {
  [DataType.Boolean]: 'bool',
  [DataType.XmlElement]: 'xml',
};

/**
 * A map providing data types for shorter extensions (Reverse of {@link DataTypeForExtension}).
 * * @type {Map<String, node-opcua~DataType>}
 */
export const DataTypeForExtension = reverse(ExtensionForDataType);

// Cache DataType
/**
 * OPC-UA data type names.
 * @type {String[]}
 */
const types = Object.keys(DataType);

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
const VariableTypeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0);
/**
 * Property data type definition node id.
 * @type {NodeId}
 */
const PropertyTypeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0);

// Cache Regular expressions
/**
 * A regular expression picking file extensions from file names.
 * @type {RegExp}
 */
const ExtensionRegExp = /\.([^/\\]*)$/;

/**
 * A set of functions that decode raw stored node values to their original value.
 * @type {Map<node-opcua~DataType, function(rawValue: String): *>}
 */
const Decoder = {
  [DataType.Boolean]: stringValue => stringValue === 'true',
  [DataType.SByte]: stringValue => parseInt(stringValue, 10),
  [DataType.Byte]: stringValue => parseInt(stringValue, 10),
  [DataType.Int16]: stringValue => parseInt(stringValue, 10),
  [DataType.UInt16]: stringValue => parseInt(stringValue, 10),
  [DataType.Int32]: stringValue => parseInt(stringValue, 10),
  [DataType.UInt32]: stringValue => parseInt(stringValue, 10),
  [DataType.Int64]: stringValue => JSON.parse(stringValue),
  [DataType.UInt64]: stringValue => JSON.parse(stringValue),
  [DataType.Float]: stringValue => parseFloat(stringValue, 10),
  [DataType.Double]: stringValue => parseFloat(stringValue, 10),
  [DataType.String]: stringValue => stringValue,
  [DataType.DateTime]: stringValue => new Date(stringValue),
  [DataType.NodeId]: stringValue => resolveNodeId(stringValue),
};

/**
 * A set of functions that encode node values before storing them.
 * @type {Map<node-opcua~DataType, function(value: *): String>}
 */
const Encoder = {
  [DataType.UInt64]: ([lo, high]) => `[${lo}, ${high}]`,
  [DataType.Int64]: ([lo, high]) => `[${lo}, ${high}]`,
  [DataType.ByteString]: binaryArray => new Buffer(binaryArray, 'binary'),
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
 * An extension to {@link vinyl~File} providing some additional, atvise-related properties.
 * @property {node-opcua~DataType} AtviseFile#dataType The {@link node-opcua~DataType} the node is
 * stored against on atvise server.
 * @property {NodeId} typeDefinition The file's type definition on atvise server.
 * FIXME: Additional properties not showing in API docs.
 */
export default class AtviseFile extends File {

  /**
   * Returns a storage path for a {@link ReadStream.ReadResult}.
   * @param {ReadStream.ReadResult} readResult The read result to get a path for.
   */
  static pathForReadResult(readResult) {
    let path = readResult.nodeId.filePath;

    if (readResult.nodeClass.value !== NodeClass.Variable.value) {
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
    if (arrayType.value !== VariantArrayType.Scalar.value) {
      path += `.${arrayType === VariantArrayType.Array ? 'array' : 'matrix'}`;
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

    const encoder = Encoder[dataType];
    const encode = v => {
      if (v === null) { return null; }

      return encoder ? encoder(v) : v.toString().trim();
    };

    if (arrayType !== VariantArrayType.Scalar) {
      return Buffer.from(JSON.stringify(Array.from(value.value).map(encode), null, '  '));
    }

    return Buffer.from(encode(value.value));
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

    if (dataType === DataType.ByteString) {
      return buffer;
    }

    const stringValue = buffer.toString();

    const decoder = Decoder[dataType];
    const decode = s => {
      if (s === null) { return null; }

      return decoder ? decoder(s) : s;
    };

    if (arrayType !== VariantArrayType.Scalar) {
      return JSON.parse(stringValue).map(decode);
    }

    return decode(stringValue);
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

    if (nodeClass.value === NodeClass.Variable.value && !value) {
      throw new Error('no value');
    }

    return new AtviseFile({
      path: AtviseFile.pathForReadResult(readResult),
      contents: value ?
        AtviseFile.encodeValue(value, value.$dataType, value.$arrayType) : // Variables
        Buffer.from(JSON.stringify({ references }, null, '  ')), // Objects, types, ...
      _nodeClass: nodeClass,
      _dataType: value && value.$dataType,
      _arrayType: value && value.$arrayType,
      _references: references,
      stat: { mtime: mtime ? this.normalizeMtime(mtime) : undefined },
    });
  }

  /**
   * Recalculates {@link AtviseFile#dataType}, {@link AtviseFile#arrayType} and
   * {@link AtviseFile#typeDefinition}. **Never call this method directly.**.
   */
  _getMetadata() {
    if (this.stem[0] === '.') { // Got non-variable node
      /**
       * The node's class.
       * @type {node-opcua~NodeClass}
       */
      this._nodeClass = NodeClass[this.stem.split('.')[1]];

      const { references = {} } = JSON.parse(this.contents.toString());

      /**
       * References the node holds: In most cases this will be a single entry for
       * `'HasTypeDefinition'`.
       * @type {Map<String, NodeId[]>}
       */
      this._references = Object.entries(references)
        .reduce((result, [type, refs]) => Object.assign(result, {
          [type]: refs.map(v => new NodeId(v)),
        }), {});
      return;
    }

    this._nodeClass = NodeClass.Variable;

    // Set default metadata
    /**
     * The node's stored {@link node-opcua~VariantArrayType}.
     * @type {?node-opcua~VariantArrayType}
     */
    this._arrayType = VariantArrayType.Scalar;

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

    const complete = () => this._dataType !== undefined &&
      this._references.HasTypeDefinition !== undefined;

    // Handle array types
    ifLastExtensionMatches(ext => ext === 'array', () => {
      this._arrayType = VariantArrayType.Array;
    });

    ifLastExtensionMatches(ext => ext === 'matrix', () => {
      this._arrayType = VariantArrayType.Matrix;
    });

    ifLastExtensionMatches(ext => typeExtensions.includes(ext), ext => {
      /**
       * The node's stored {@link node-opcua~DataType}.
       * @type {?node-opcua~DataType}
       */
      this._dataType = DataType[types[typeExtensions.indexOf(ext)]];
    });

    // Handle wrapped data types (e.g. "bool" for DataType.Boolean)
    ifLastExtensionMatches(ext => DataTypeForExtension[ext], ext => {
      this._dataType = DataType[DataTypeForExtension[ext]];
    });

    if (extensions.length === 0) { // Got variable
      /**
       * The node's stored type definition.
       * @type {?node-opcua~NodeId}
       */
      this._references.HasTypeDefinition = [new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0)];
    }

    ifLastExtensionMatches(ext => ext === 'prop', () => {
      this._references.HasTypeDefinition = [new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0)];
    });

    ifLastExtensionMatches(ext => ext === 'var', () => {
      this._references.HasTypeDefinition = [new NodeId('Custom.VarResourceType')];
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
      this._references.HasTypeDefinition = [
        new NodeId('VariableTypes.ATVISE.Resource.OctetStream'),
      ];
      this._dataType = DataType.ByteString;
    }
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
   * The file's type definition.
   * @type {node-opcua~NodeId}
   */
  get typeDefinition() {
    if (!this._references) {
      this._getMetadata();
    }

    if (this._references && this._references.HasTypeDefinition) {
      return this._references.HasTypeDefinition[0];
    }

    return new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0);
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

    if (this.dataType === DataType.DateTime) {
      return value.valueOf();
    }

    return value;
  }

  /**
   * Returns the node id associated with the file.
   * @type {NodeId} The file's node id.
   */
  get nodeId() {
    if (this.nodeClass.value !== NodeClass.Variable.value) {
      return NodeId.fromFilePath(dirname(this.relative));
    }
    const atType = AtviseTypesByValue[this.typeDefinition.value];
    let idPath = this.relative;

    if (!atType || !atType.keepExtension) {
      const exts = idPath.match(ExtensionRegExp)[1];
      idPath = idPath.split(`.${exts}`)[0];
    }

    return NodeId.fromFilePath(idPath);
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
        readFile(options.path, (err, contents) => {
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
