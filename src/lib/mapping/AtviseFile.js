import Int64 from 'node-int64';
import { readFile } from 'fs';
import { dirname, join, relative } from 'path';
import { DataType, VariantArrayType, resolveNodeId, coerceLocalizedText } from 'node-opcua';
import File from 'vinyl';
import ProjectConfig from '../../config/ProjectConfig';
import AtviseTypes from './Types';
import NodeId from '../ua/NodeId';

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
 * Seperator for array values
 * @type {String}
 */
const ArrayValueSeperator = '@atscmUaNodeArraySeperator@';

/**
 * A map providing shorter extensions for data types
 * @type {Map<node-opcua~DataType, String>}
 */
export const ExtensionForDataType = {
  [DataType.Boolean]: 'bool',
  [DataType.XmlElement]: 'xml',
};

/**
 * Switches keys and values in an object. E.G.: { "a": 1 } becomes { 1: "a" }.
 * @param {Object} obj The object to reverse.
 * @return {Object} The reversed object.
 */
function reverseObject(obj) {
  return Object.keys(obj)
      .reduce((result, key) => Object.assign(result, {
        [obj[key]]: key,
      }), {});
}

/**
 * A map providing data types for shorter extensions (Reverse of {@link DataTypeForExtension}).
 * * @type {Map<String, node-opcua~DataType>}
 */
export const DataTypeForExtension = reverseObject(ExtensionForDataType);

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

// Value encoding related cache
/**
 * A set of functions that decode raw stored node values to their original value.
 * @type {Map<node-opcua~DataType, function(rawValue: String): *>}
 */
const Decoder = {
  [DataType.Boolean]: stringValue => stringValue === 'true',
  [DataType.String]: stringValue => stringValue,
  [DataType.NodeId]: stringValue => resolveNodeId(stringValue),
  [DataType.DateTime]: stringValue => new Date(stringValue),
  [DataType.UInt64]: stringValue => parseInt(stringValue, 10),
  [DataType.Int64]: stringValue => parseInt(stringValue, 10),
  [DataType.Int32]: stringValue => parseInt(stringValue, 10),
  [DataType.SByte]: stringValue => parseInt(stringValue, 10),
  [DataType.Byte]: stringValue => parseInt(stringValue, 10),
  [DataType.UInt32]: stringValue => parseInt(stringValue, 10),
  [DataType.Double]: stringValue => parseFloat(stringValue, 10),
  [DataType.Float]: stringValue => parseFloat(stringValue, 10),
  [DataType.XmlElement]: stringValue => stringValue,
  [DataType.LocalizedText]: stringValue => coerceLocalizedText(stringValue.split('text=')[1]),
};


/**
 * A set of functions that decode node values create node script.
 * @type {Map<node-opcua~DataType, function(value: *): String>}
 */
const CreateNodeDecoder = {
  [DataType.ByteString]: buffer => buffer.toString('binary'),
  [DataType.DateTime]: buffer => new Date(buffer.toString()).getTime(),
};


/**
 * Converts safely two uint32 array to an int64 number type.
 * @param {Number} lowerRangeValue The value for the lower 32 bits of the int 64 value
 * @param {Number} higherRangeValue The value for the higher 32 bits of the int 64 value
 * @returns {Number} The resulting int64 value
 */
function uint32ArraysToInt64(lowerRangeValue, higherRangeValue) {
  const int64 = new Int64(lowerRangeValue, higherRangeValue);

  if (!isFinite(int64)) {
    throw new Error('Value is too big for Javascript Number type');
  }

  return int64.toString();
}


/**
 * A set of functions that encode node values before storing them.
 * @type {Map<node-opcua~DataType, function(value: *): String>}
 */
const Encoder = {
  [DataType.UInt64]: uInt32Array => uint32ArraysToInt64(uInt32Array[0], uInt32Array[1]),
  [DataType.Int64]: int32Array => uint32ArraysToInt64(int32Array[0], int32Array[1]),
  [DataType.ByteString]: byteString => new Buffer(byteString),
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
   * Returns a storage path for a {@link MappingItem.configObj}.
   * @param {Object} config The config to create the path for
   */
  static pathForItemConfig(config) {
    let path = `${config.nodeId.filePath}/${config.nodeId.browseName}`;

    const dataType = config.dataType;
    const arrayType = config.arrayType;
    const typeDefinition = config.typeDefinition;

    if (typeDefinition.value === VariableTypeDefinition.value) {
      // Variable nodes are stored with their lowercase datatype as an extension
      path += `.${extensionForDataType(dataType)}`;
    } else if (typeDefinition.value === PropertyTypeDefinition.value) {
      // Property nodes are stored with '.prop' and their lowercase datatype as an extension
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

    if (arrayType) {
      // Add 'array' or 'matrix' extensions for corresponding array types
      if (arrayType.value !== VariantArrayType.Scalar.value) {
        path += `.${arrayType.value === VariantArrayType.Array.value ? 'array' : 'matrix'}`;
      }
    }

    return path;
  }

  /**
   * Returns an atvise type with type definition as accessor
   * @return {AtviseTypes{}} Object containing atvise types
   */
  static getAtviseTypesByValue() {
    return AtviseTypesByValue;
  }

  /**
   * Encodes a node's value to file contents.
   * @param {*} value The value to encode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to encode the value for.
   * @param {node-opcua~VariantArrayType} arrayType The files array type
   * @return {?Buffer} The encoded file contents or null.
   */
  static encodeValue(value, dataType, arrayType) {
    if (value === null) {
      return Buffer.from('');
    }

    const encoder = Encoder[dataType];

    if (arrayType === VariantArrayType.Array) {
      const arrayContent = value.map(item => {
        if (encoder) {
          return encoder(item);
        }

        return item;
      })
        .join(ArrayValueSeperator);

      return Buffer.from(arrayContent);
    }

    return Buffer.from(encoder ? encoder(value) : value.toString().trim());
  }

  /**
   * Decodes a file's contents to a node's value.
   * @param {Buffer} buffer The file contents to decode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to decode the contents
   * @param {node-opcua~VariantArrayType} arrayType The files array type
   * @param {Boolean} useCreateNodeEncoding If set to `true`, create node decoders will overwrite
   * the existing decoders
   * @return {?*} The decoded node value or null.
   */
  static decodeValue(buffer, dataType, arrayType, useCreateNodeEncoding) {
    let decoder = Decoder[dataType];
    let bufferValue;

    if (buffer === null || buffer.length === 0) {
      return null;
    }

    if (useCreateNodeEncoding && CreateNodeDecoder[dataType]) {
      decoder = CreateNodeDecoder[dataType];
      bufferValue = buffer;
    } else {
      bufferValue = buffer.toString();
    }

    if (arrayType === VariantArrayType.Array) {
      const arrayValue = bufferValue.toString().split(ArrayValueSeperator);

      return arrayValue.map(item => {
        if (decoder) {
          return decoder(item);
        }

        return item;
      });
    } else if (decoder) {
      return decoder(bufferValue);
    }

    return buffer;
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
   * Creates a new {@link AtviseFile} for the given {@link MappingItem}.
   * @param {MappingItem} mappingItem The read result to create the file for.
   * @return {AtviseFile} The resulting file.
   */
  static fromMappingItem(mappingItem) {
    let configObj = {};

    if (!mappingItem) {
      throw new Error('Mapping item is undefined');
    }

    configObj = mappingItem.configObj;

    return new AtviseFile({
      path: AtviseFile.pathForItemConfig(configObj),
      contents: AtviseFile.encodeValue(configObj.value, configObj.dataType, configObj.arrayType),
      _dataType: configObj.dataType,
      _arrayType: configObj.arrayType,
      _typeDefinition: configObj.typeDefinition,
      stat: { mtime: configObj.mtime ? this.normalizeMtime(configObj.mtime) : undefined },
    });
  }

  /**
   * Recalculates {@link AtviseFile#dataType}, {@link AtviseFile#arrayType} and
   * {@link AtviseFile#typeDefinition}. **Never call this method directly.**.
   */
  _getMetadata() {
    // Set default metadata
    /**
     * The node's stored {@link node-opcua~VariantArrayType}.
     * @type {?node-opcua~VariantArrayType}
     */
    this._arrayType = VariantArrayType.Scalar;

    let extensions = [];
    const relPath = this.relativeFilePath;
    const m = relPath.match(ExtensionRegExp);
    if (m) {
      extensions = m[1].split('.');
    }

    // For split files, add the directory name extension
    const dirnameExts = dirname(relPath).split('.');
    if (dirnameExts.length > 1) {
      extensions.unshift(dirnameExts[dirnameExts.length - 1]);
    }

    function ifLastExtensionMatches(matches, fn) {
      if (matches(extensions[extensions.length - 1])) {
        fn(extensions.pop());
      }
    }

    const complete = () => this._dataType !== undefined && this._typeDefinition !== undefined;

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

    // Handle wrapped data types (e.g. 'bool' for DataType.Boolean)
    ifLastExtensionMatches(ext => DataTypeForExtension[ext], ext => {
      this._dataType = DataType[DataTypeForExtension[ext]];
    });

    if (extensions.length === 0) { // Got variable
      /**
       * The node's stored type definition.
       * @type {?node-opcua~NodeId}
       */
      this._typeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0);
    }

    ifLastExtensionMatches(ext => ext === 'prop', () => {
      this._typeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0);
    });

    ifLastExtensionMatches(ext => ext === 'var', () => {
      this._typeDefinition = new NodeId('Custom.VarResourceType');
    });

    if (!complete()) {
      // Handle atvise types
      let foundAtType = false;

      Object.keys(AtviseTypesByIdentifier).forEach(identifier => {
        if (!foundAtType && extensions.includes(identifier)) {
          foundAtType = true;
          const type = AtviseTypesByIdentifier[identifier];

          this._typeDefinition = type.typeDefinition;
          this._dataType = type.dataType;
        }
      });
    }

    if (!complete()) {
      this._typeDefinition = new NodeId('VariableTypes.ATVISE.Resource.OctetStream');
      this._dataType = DataType.ByteString;
    }
  }

  /**
   * The file's relative path (base = 'src' folder)
   * @type {String}
   */
  get relativeFilePath() {
    const path = this.path;
    // build source path here because Project config is undefined when AtviseFile is loaded
    const srcPath = join(process.cwd(), ProjectConfig.RelativeSourceDirectoryPath);

    return path.indexOf(srcPath) > -1 ? relative(srcPath, this.path) : path;
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
    if (!this._typeDefinition) {
      this._getMetadata();
    }

    return this._typeDefinition;
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
   * `true` for files containing type definitions.
   * @type {Boolean}
   */
  get isTypeDefinition() {
    return this.isBaseTypeDefinition || this.isInstanceTypeDefinition;
  }


  /**
   * `true` for files containing instance type definitions.
   * @type {Boolean}
   */
  get isInstanceTypeDefinition() {
    return this.typeDefinition.value === 'Custom.InstanceTypeDefinition';
  }

  /**
   * `true` for files containing base type definitions.
   * @type {Boolean}
   */
  get isBaseTypeDefinition() {
    return this.typeDefinition.value === 'Custom.BaseTypeDefinition';
  }

  /**
   * `true` for files containing type definitions.
   * @type {Boolean}
   */
  get isAtviseReferenceConfig() {
    return this.typeDefinition.value === 'Custom.AtvReferenceConfig';
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
    return AtviseFile.decodeValue(this.contents, this.dataType, this.arrayType, true);
  }

  /**
   * Returns the node id associated with the file.
   * @type {NodeId} The file's node id.
   */
  get nodeId() {
    return NodeId.fromFilePath(dirname(this.relativeFilePath));
  }

  /**
   * Returns a new file with all attributes of the current file.
   * @param {Object} options See the {@link vinyl~File} docs for all options available.
   * @return {AtviseFile} The cloned file.
   * @see https://github.com/gulpjs/vinyl#filecloneoptions
   */
  clone(options) {
    const clonedFile = super.clone(options);

    clonedFile._arrayType = this._arrayType;

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
