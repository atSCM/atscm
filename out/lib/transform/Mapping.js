'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataTypeForExtension = exports.ExtensionForDataType = undefined;

var _nodeOpcua = require('node-opcua');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _NodeId = require('../server/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _AtviseFile = require('../server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

var _Types = require('../server/Types');

var _Types2 = _interopRequireDefault(_Types);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AtviseTypesByValue = _Types2.default.reduce((result, type) => Object.assign(result, {
  [type.typeDefinition.value]: type
}), {});

const AtviseTypesByIdentifier = _Types2.default.reduce((result, type) => Object.assign(result, {
  [type.identifier]: type
}), {});

// Shorten extensions
/**
 * A map providing shorter extensions for data types
 * @type {Map<NodeOpcua.DataType, String>}
 */
const ExtensionForDataType = exports.ExtensionForDataType = {
  [_nodeOpcua.DataType.Boolean]: 'bool',
  [_nodeOpcua.DataType.XmlElement]: 'xml'
};

function reverseObject(obj) {
  return Object.keys(obj).reduce((result, key) => Object.assign(result, {
    [obj[key]]: key
  }), {});
}

/**
 * A map providing data types for shorter extensions (Reverse of {@link DataTypeForExtension}).
 * * @type {Map<String, NodeOpcua.DataType>}
 */
const DataTypeForExtension = exports.DataTypeForExtension = reverseObject(ExtensionForDataType);

// Cache DataType
const types = Object.keys(_nodeOpcua.DataType);
const typeExtensions = types.map(t => t.toLowerCase());

// Cache TypeDefinitions
const VariableTypeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 62, 0);
const PropertyTypeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 68, 0);

/**
 * A transformer that maps nodes to files.
 */
class MappingTransformer extends _Transformer2.default {

  /**
   * Returns the extension for a specific {@link NodeOpcua.DataType}.
   * Algorithm:
   *   - if the type has a shortened extension defined in {@link ExtensionForDataType}, return it.
   *   - else return the DataType's name, in lowercase letters.
   * @param {NodeOpcua.DataType} dataType The datatype to get the extension for.
   * @return {String} The resulting extension.
   */
  extensionForDataType(dataType) {
    return ExtensionForDataType[dataType] || dataType.toString().toLowerCase();
  }

  /**
   * Maps {@link NodeStream.ReadResult}s to files.
   * @param {NodeStream.ReadResult} readResult The read results to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occured
   * while transforming or the resulting {@link AtviseFile}.
   */
  transformFromDB(readResult, enc, callback) {
    if (!readResult.value) {
      _gulplog2.default.warn(`No value received for ${readResult.nodeId.toString()}`);
      callback(null);
      // callback(new Error(`No value received for ${readResult.nodeId.toString()}`));
    } else {
      const dataType = readResult.value.$dataType;
      const arrayType = readResult.value.$arrayType;
      const typeDefinition = readResult.referenceDescription.typeDefinition;

      let path = readResult.nodeId.filePath;

      if (typeDefinition.value === VariableTypeDefinition.value) {
        // Variable nodes are stored with their lowercase datatype as an extension
        path += `.${this.extensionForDataType(dataType)}`;
      } else if (typeDefinition.value === PropertyTypeDefinition.value) {
        // Property nodes are stored with ".prop" and their lowercase datatype as an extension
        path += `.prop.${this.extensionForDataType(dataType)}`;
      } else {
        // Handle object types
        let identifier = 'obj';
        let fileExtension = false;
        let keepExtension = false;

        const atType = AtviseTypesByValue[typeDefinition.value];
        if (atType) {
          identifier = atType.identifier;
          fileExtension = atType.fileExtension;
          keepExtension = atType.keepExtension;
        } else {
          process.stdout.clearLine();
          _gulplog2.default.warn('\rMissing', typeDefinition.namespace, typeDefinition.value, `(${readResult.nodeId.value})`);
        }

        if (!keepExtension) {
          path += `.${identifier}.${fileExtension || this.extensionForDataType(dataType)}`;
        }
      }

      // Add "array" or "matrix" extensions for corresponding array types
      if (arrayType !== _nodeOpcua.VariantArrayType.Scalar) {
        path += `.${arrayType === _nodeOpcua.VariantArrayType.Array ? 'array' : 'matrix'}`;
      }

      callback(null, new _AtviseFile2.default({
        path,
        contents: Buffer.from(readResult.value && readResult.value.value ? readResult.value.value.toString() : ''),
        dataType,
        arrayType,
        typeDefinition
      }));
    }
  }

  /**
   * Transforms a {@link File} to an {@link AtviseFile}.
   * @param {File} rawFile The file to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occured
   * while transforming or the resulting {@link AtviseFile}.
   */
  transformFromFilesystem(rawFile, enc, callback) {
    const file = rawFile.clone();

    // Set default meta data
    file.arrayType = _nodeOpcua.VariantArrayType.Scalar;

    const extensions = file.relative.match(/\.(.*)/)[1].split('.');

    function ifLastExtensionMatches(matches, fn) {
      if (matches(extensions[extensions.length - 1])) {
        fn(extensions.pop());
      }
    }

    function complete() {
      return file.dataType !== undefined && file.typeDefinition !== undefined;
    }

    // Handle array types
    ifLastExtensionMatches(ext => ext === 'array', () => {
      file.arrayType = _nodeOpcua.VariantArrayType.Array;
    });

    ifLastExtensionMatches(ext => ext === 'matrix', () => {
      file.arrayType = _nodeOpcua.VariantArrayType.Matrix;
    });

    ifLastExtensionMatches(ext => typeExtensions.includes(ext), ext => {
      file.dataType = _nodeOpcua.DataType[types[typeExtensions.indexOf(ext)]];
    });

    // Handle wrapped data types (e.g. "bool" for DataType.Boolean)
    ifLastExtensionMatches(ext => DataTypeForExtension[ext], ext => {
      file.dataType = _nodeOpcua.DataType[DataTypeForExtension[ext]];
    });

    if (extensions.length === 0) {
      // Got variable
      file.typeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 62, 0);
    }

    ifLastExtensionMatches(ext => ext === 'prop', () => {
      file.typeDefinition = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 68, 0);
    });

    let gotCustomType = false;
    ifLastExtensionMatches(ext => ext === 'obj', () => {
      gotCustomType = true;

      _gulplog2.default.warn('NEED SPECIAL HANDLING');
    });

    if (!gotCustomType && !complete()) {
      // Handle atvise types
      let foundAtType = false;

      Object.keys(AtviseTypesByIdentifier).forEach(identifier => {
        if (!foundAtType && extensions.includes(identifier)) {
          foundAtType = true;
          const type = AtviseTypesByIdentifier[identifier];

          file.typeDefinition = type.typeDefinition;
          file.dataType = type.dataType;
        }
      });
    }

    if (!gotCustomType && !complete()) {
      _gulplog2.default.warn('FALLING BACK TO OCTET STREAM');
      file.typeDefinition = new _NodeId2.default('VariableTypes.ATVISE.Resource.OctetStream');
      file.dataType = _nodeOpcua.DataType.ByteString;
    }

    if (!complete()) {
      _gulplog2.default.warn('Unable to map', file.relative);
      callback(null);
    } else {
      callback(null, file);
    }
  }

}
exports.default = MappingTransformer;