"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

var _assert = _interopRequireDefault(require("assert"));

var _variant = require("node-opcua/lib/datamodel/variant");

var _Transformer = _interopRequireDefault(require("../lib/transform/Transformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Atvise specific types that need special extensions.
 * @type {Map<string, Object>}
 */
const standardTypes = {
  'VariableTypes.ATVISE.HtmlHelp': {
    extension: '.help.html',
    dataType: _variant.DataType.ByteString
  },
  'VariableTypes.ATVISE.TranslationTable': {
    extension: '.locs.xml',
    dataType: _variant.DataType.XmlElement
  }
};
/**
 * Extensions to use for {@link node-opcua~DataType}s.
 * @type {Map<string, string>}
 */

const extensionForDataType = {
  [_variant.DataType.Boolean.key]: '.bool',
  [_variant.DataType.SByte.key]: '.sbyte',
  [_variant.DataType.Byte.key]: '.byte',
  [_variant.DataType.Int16.key]: '.int16',
  [_variant.DataType.UInt16.key]: '.uint16',
  [_variant.DataType.Int32.key]: '.int32',
  [_variant.DataType.UInt32.key]: '.uint32',
  [_variant.DataType.Int64.key]: '.int64',
  [_variant.DataType.UInt64.key]: '.uint64',
  [_variant.DataType.Float.key]: '.float',
  [_variant.DataType.Double.key]: '.double',
  [_variant.DataType.String.key]: '.string',
  [_variant.DataType.DateTime.key]: '.datetime',
  [_variant.DataType.Guid.key]: '.guid',
  // [DataType.ByteString.key]: '.bytestring',
  [_variant.DataType.XmlElement.key]: '.xml',
  [_variant.DataType.NodeId.key]: '.nodeid',
  [_variant.DataType.ExpandedNodeId.key]: '.enodeid',
  [_variant.DataType.StatusCode.key]: '.status',
  [_variant.DataType.QualifiedName.key]: '.name',
  [_variant.DataType.LocalizedText.key]: '.text',
  [_variant.DataType.ExtensionObject.key]: '.obj',
  [_variant.DataType.DataValue.key]: '.value',
  [_variant.DataType.Variant.key]: '.variant',
  [_variant.DataType.DiagnosticInfo.key]: '.info'
};
/**
 * Extensions to use for {@link node-opcua~VariantArrayType}s.
 * @type {Map<string, string>}
 */

const extensionForArrayType = {
  [_variant.VariantArrayType.Array.key]: '.array',
  [_variant.VariantArrayType.Matrix.key]: '.matrix'
};
/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */

class MappingTransformer extends _Transformer.default {
  /**
   * Creates a new mapping transformer.
   * @param {any[]} args The arguments passed to the {@link Transformer} constructor.
   */
  constructor(...args) {
    super(...args);
    /**
     * Contents of the reference files read but not used yet.
     * @type {Object}
     */

    this._readReferenceFiles = {};
  }
  /**
   * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read. If a read file has a
   * non-standard type (definition) an additional `rc` file is pushed holding this type.
   * @param {Node} node The read result to create the file for.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */


  transformFromDB(node, encoding, callback) {
    if (!node.fullyMapped && !node.parentResolvesMetadata) {
      // Skip mapping for e.g. split files
      const typeDefinition = node.typeDefinition;
      let isStandardTypeNode = false; // Add extensions for standard types

      for (const [def, {
        extension
      }] of Object.entries(standardTypes)) {
        if (node.isVariable && typeDefinition === def) {
          node.renameTo(`${node.name}${extension}`);
          isStandardTypeNode = true; // FIXME: Set dataType and mark as resolved
          // FIXME: Set typeDefinition and mark as resolved
        } else if (node.fileName.endsWith(extension)) {
          callback(new Error(`Name conflict: ${node.nodeId} should not end with '${extension}'`));
          return;
        }
      } // Add extensions for data types


      for (const [type, ext] of Object.entries(extensionForDataType)) {
        if (node.isVariable && node.value && node.value.dataType.key === type) {
          if (!isStandardTypeNode) {
            node.renameTo(`${node.name}${ext}`);
            break;
          } // FIXME: Set dataType and mark as resolved

        }
      } // Add extensions for array types


      for (const [type, ext] of Object.entries(extensionForArrayType)) {
        if (node.isVariable && node.value.arrayType.key === type) {
          if (!isStandardTypeNode) {
            node.renameTo(`${node.name}${ext}`);
          } // FIXME: Set arrayType and mark as resolved

        } else if (node.fileName.endsWith(ext)) {
          callback(new Error(`Name conflict: ${node.nodeId} should not end with '${ext}'`));
          return;
        }
      }
    } // Compact mapping: Root source folders are AGENT, SYSTEM, ObjectTypes and VariableTypes
    // FIXME: Make optional


    const ignore = new Set([58, // Objects -> Types -> BaseObjectType
    62, // Objects -> Types -> BaseVariableType
    85, // Objects
    86]);

    for (let c = node; c && c.parent && !c._compactMappingApplied; c = c.parent) {
      if (ignore.has(c.parent.id.value)) {
        c.parent = c.parent.parent;
        c = node;
      }
    }

    Object.assign(node, {
      _compactMappingApplied: true
    });
    callback(null, node);
  }
  /**
   * Writes an {@link AtviseFile} for each {@link Node} read.
   * @param {Node} node The raw file.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */


  transformFromFilesystem(node, encoding, callback) {
    let isStandardTypeNode = false; // Resolve standard type from extension

    for (const [, {
      extension
    }] of Object.entries(standardTypes)) {
      if (node.name.endsWith(extension)) {
        isStandardTypeNode = true; // FIXME: Set dataType and mark as resolved
        // FIXME: Set typeDefinition and mark as resolved

        node.renameTo((0, _path.basename)(node.name, extension));
      }
    } // Resolve arrayType from extension


    for (const [type, extension] of Object.entries(extensionForArrayType)) {
      if (node.name.endsWith(extension) && !isStandardTypeNode) {
        _assert.default.equal(node.arrayType.key, type); // FIXME: Set arrayType and mark as resolved


        node.renameTo((0, _path.basename)(node.name, extension));
        break;
      }
    } // Resolve dataType from extension


    for (const [type, extension] of Object.entries(extensionForDataType)) {
      if (node.name.endsWith(extension) && !isStandardTypeNode && node.dataType.key === type) {
        // FIXME: Set dataType and mark as resolved
        node.renameTo((0, _path.basename)(node.name, extension));
        break;
      }
    }

    return callback(null, node);
  }
  /**
   * `true` as the mapping transformer should infer references from config files.
   */


  get transformsReferenceConfigFiles() {
    return true;
  }

}

exports.default = MappingTransformer;
//# sourceMappingURL=Mapping.js.map