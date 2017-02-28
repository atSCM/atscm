import File from 'vinyl';
import { DataType, VariantArrayType, resolveNodeId } from 'node-opcua';
import Logger from 'gulplog';
import AtviseTypes from './Types';
import NodeId from './NodeId';

// Path related cache
const AtviseTypesByValue = AtviseTypes
  .reduce((result, type) => Object.assign(result, {
    [type.typeDefinition.value]: type,
  }), {});

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
const types = Object.keys(DataType);
const typeExtensions = types.map(t => t.toLowerCase());

// Cache TypeDefinitions
const VariableTypeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 62, 0);
const PropertyTypeDefinition = new NodeId(NodeId.NodeIdType.NUMERIC, 68, 0);

// Cache Regular expressions
const ExtensionRegExp = /\.([^/\\]*)$/;

// Value encoding related cache
const Decoder = {
  [DataType.Boolean]: stringValue => stringValue === 'true',
  [DataType.String]: stringValue => stringValue,
  [DataType.NodeId]: stringValue => resolveNodeId(stringValue),
  [DataType.DateTime]: stringValue => new Date(Number.parseInt(stringValue, 10)),
};

const Encoder = {
  [DataType.DateTime]: date => date.getTime().toString(),
};

/**
 * Returns the extension for a specific {@link node-opcua~DataType}.
 * Algorithm:
 *   - if the type has a shortened extension defined in {@link ExtensionForDataType}, return it.
 *   - else return the DataType's name, in lowercase letters.
 * @param {node-opcua~DataType} dataType The datatype to get the extension for.
 * @return {String} The resulting extension.
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

    const dataType = readResult.value.$dataType;
    const arrayType = readResult.value.$arrayType;
    const typeDefinition = readResult.referenceDescription.typeDefinition;

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
      } else {
        process.stdout.clearLine();
        Logger.warn('\rMissing', typeDefinition.namespace, typeDefinition.value,
          `(${readResult.nodeId.value})`);
      }

      if (!keepExtension) {
        path += `.${identifier}.${fileExtension || extensionForDataType(dataType)}`;
      }
    }

    // Add "array" or "matrix" extensions for corresponding array types
    if (arrayType !== VariantArrayType.Scalar) {
      path += `.${arrayType === VariantArrayType.Array ? 'array' : 'matrix'}`;
    }

    return path;
  }

  /**
   * Encodes a node's value to file contents.
   * @param {*} value The value to encode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to encode the value for.
   * @return {?Buffer} The encoded file contents or null.
   */
  static encodeValue(value, dataType) {
    if (value.value === null) {
      return Buffer.from('');
    }

    const encoder = Encoder[dataType];
    return Buffer.from(encoder ? encoder(value.value) : value.value.toString());
  }

  /**
   * Decodes a file's contents to a node's value
   * @param {Buffer} buffer The file contents to decode.
   * @param {node-opcua~DataType} dataType The {@link node-opcua~DataType} to decode the contents
   * for.
   * @return {?*} The decoded node value or null.
   */
  static decodeValue(buffer, dataType) {
    if (buffer === null || buffer.length === 0) {
      return null;
    }

    const decoder = Decoder[dataType];

    if (decoder) {
      return decoder(buffer.toString());
    }

    return buffer;
  }

  /**
   * Creates a new {@link AtviseFile} for the given {@link ReadStream.ReadResult}.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @return {AtviseFile} The resulting file.
   */
  static fromReadResult(readResult) {
    if (!readResult.value) {
      throw new Error('no value');
    }

    return new AtviseFile({
      path: AtviseFile.pathForReadResult(readResult),
      contents: AtviseFile.encodeValue(readResult.value, readResult.value.$dataType),
      _dataType: readResult.value.$dataType,
      _arrayType: readResult.value.$arrayType,
      _typeDefinition: readResult.referenceDescription.typeDefinition,
    });
  }

  /**
   * Recalculates {@link AtviseFile#dataType}, {@link AtviseFile#arrayType} and
   * {@link AtviseFile#typeDefinition}. **Never call this method directly.**
   */
  _getMetadata() {
    // Set default metadata
    /**
     * The node's stored {@link node-opcua~VariantArrayType}.
     * @type {?node-opcua~VariantArrayType}
     */
    this._arrayType = VariantArrayType.Scalar;

    let extensions = [];
    extensions = this.relative.match(ExtensionRegExp)[1].split('.');

    // For split files, add the directory name extension
    const dirnameExts = this.dirname.split('.');
    if (dirnameExts.length > 1) {
      extensions.unshift(dirnameExts[1]);
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

    // Handle wrapped data types (e.g. "bool" for DataType.Boolean)
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

    let gotCustomType = false;
    ifLastExtensionMatches(ext => ext === 'obj', () => {
      gotCustomType = true;

      Logger.warn('NEED SPECIAL HANDLING');
    });

    if (!gotCustomType && !complete()) {
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

    if (!gotCustomType && !complete()) {
      this._typeDefinition = new NodeId('VariableTypes.ATVISE.Resource.OctetStream');
      this._dataType = DataType.ByteString;
    }

    if (!complete()) {
      Logger.warn('Unable to map', this.relative);
    }
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
   * @type {Boolean}
   */
  get isDisplay() {
    return this.typeDefinition.value === 'VariableTypes.ATVISE.Display';
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
    this.contents = AtviseFile.encodeValue(newValue, this.dataType);
  }

  /**
   * Returns the decoded node value for the file.
   * @type {?*} The file's decoded value.
   */
  get value() {
    return AtviseFile.decodeValue(this.contents, this.dataType);
  }

  /**
   * Returns the node id associated with the file.
   * @type {NodeId} The file's node id.
   */
  get nodeId() {
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
   * @param {Object} options See https://github.com/gulpjs/vinyl#filecloneoptions for all options
   * available.
   * @return {AtviseFile} The cloned file.
   */
  clone(options) {
    const clonedFile = super.clone(options);

    clonedFile._arrayType = this._arrayType;

    return clonedFile;
  }

}
