import { basename } from 'path';
import { VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import { DataType, ReferenceTypeIds } from 'node-opcua';
import Transformer from '../lib/transform/Transformer';
import { reverse } from '../lib/helpers/Object';

const standardTypes = {
  'VariableTypes.ATVISE.HtmlHelp': {
    extension: '.help.html',
    dataType: DataType.XmlElement,
  },
  'VariableTypes.ATVISE.TranslationTable': {
    extension: '.locs.xml',
    dataType: DataType.ByteString,
  },
};

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
export default class MappingTransformer extends Transformer {

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
    if (node.parentResolvesMetadata) { // Skip e.g. split files
      callback(null, node);
      return;
    }

    const typeDefinition = node.typeDefinition;
    if (!typeDefinition) {
      console.error('Missing type definition', node.nodeId);
    }

    for (const [def, { extension }] of Object.entries(standardTypes)) {
      if (node.isVariable && typeDefinition === def) {
        Object.assign(node, { fileName: `${node.fileName}${extension}` });

        node.markReferenceAsResolved('HasTypeDefinition', typeDefinition);
        node.markAsResolved('nodeClass');
        node.markAsResolved('dataType');
        break;
      } else if (node.fileName.endsWith(extension)) {
        callback(new Error(`Name conflict: ${node.nodeId} should not end with '${extension}'`));
        return;
      }
    }

    const extensionForDataType = {
      [DataType.Boolean.key]: '.bool',
      [DataType.SByte.key]: '.sbyte',
      [DataType.Byte.key]: '.byte',
      [DataType.Int16.key]: '.int16',
      [DataType.UInt16.key]: '.uint16',
      [DataType.Int32.key]: '.int32',
      [DataType.UInt32.key]: '.uint32',
      [DataType.Int64.key]: '.int64',
      [DataType.UInt64.key]: '.uint64',
      [DataType.Float.key]: '.float',
      [DataType.Double.key]: '.double',
      [DataType.String.key]: '.string',
      [DataType.DateTime.key]: '.datetime',
      [DataType.Guid.key]: '.guid',
      // [DataType.ByteString.key]: '.bytestring',
      [DataType.XmlElement.key]: '.xml',
      [DataType.NodeId.key]: '.nodeid',
      [DataType.ExpandedNodeId.key]: '.enodeid',
      [DataType.StatusCode.key]: '.status',
      [DataType.QualifiedName.key]: '.name',
      [DataType.LocalizedText.key]: '.text',
      [DataType.ExtensionObject.key]: '.obj',
      [DataType.DataValue.key]: '.value',
      [DataType.Variant.key]: '.variant',
      [DataType.DiagnosticInfo.key]: '.info',
    };

    // Check for appended extensions
    if (node.fileName.endsWith('.prop')) {
      callback(new Error(`Name conflict: ${node.nodeId} should not end with '.prop'`));
      return;
    }

    // FIXME: Check '.array', '.matrix'

    if (node.isVariable) {
      if (!node.isResolved('nodeClass')) {
        node.markAsResolved('nodeClass');
      }

      if (node.hasUnresolvedReference('HasTypeDefinition') && node.typeDefinition === 62) {
        node.markReferenceAsResolved('HasTypeDefinition', 62);
      } else if (node.hasUnresolvedReference('HasTypeDefinition') && node.typeDefinition === 68) {
        Object.assign(node, { fileName: `${node.fileName}.prop` });

        node.markReferenceAsResolved('HasTypeDefinition', 68);
      }

      for (const [type, ext] of Object.entries(extensionForDataType)) {
        if (!node.isResolved('dataType')) {
          if (node.isVariable && node.value.dataType.key === type) {
            Object.assign(node, { fileName: `${node.fileName}${ext}` });

            node.markAsResolved('dataType');
            break;
          } else if (node.fileName.endsWith(ext)) {
            callback(new Error(`Name conflict: ${node.nodeId} should not end with '${ext}'`));
            return;
          }
        }
      }

      if (!node.isResolved('arrayType')) {
        if (node.arrayType !== VariantArrayType.Scalar) {
          Object.assign(node, {
            fileName: `${node.fileName}.${node.arrayType.key.toLowerCase()}`,
          });
        }

        node.markAsResolved('arrayType');
      }
    } else {
      node.markAsResolved('dataType');
      node.markAsResolved('arrayType');
    }

    // Legacy mapping: Root source folders are AGENT, SYSTEM, ObjectTypes and VariableTypes
    // FIXME: Make optional
    const ignore = new Set([
      58, // Objects -> Types -> BaseObjectType
      62, // Objects -> Types -> BaseVariableType
      85, // Objects
      86, // Objects -> Types
    ]);

    for (let c = node; c && c.parent && !c._compactMappingApplied; c = c.parent) {
      if (ignore.has(c.parent.id.value)) {
        c.parent = c.parent.parent;
        c = node;
      }
    }

    Object.assign(node, {
      _compactMappingApplied: true,
    });

    callback(null, node);
  }

  /**
   * Writes an {@link AtviseFile} for each {@link vinyl~File} read.
   * @param {vinyl~File} file The raw file.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromFilesystem(file, encoding, callback) {
    if (file.isDirectory()) {
      callback(null);
    } else if (file.stem[0] === '.' && !NodeClass[file.stem.slice(1)]) {
      if (file.extname !== '.json') {
        Logger.debug('Ignoring file', file.relative);
        callback(null);
        return;
      }
      try {
        const config = JSON.parse(file.contents);
        this._readReferenceFiles[file.stem.slice(1)] = config;
      } catch (e) {
        if (file.relative.match(/\.var\./)) {
          callback(new Error(`Failed to parse reference file: ${e.message}`));
          return;
        }

        Logger.debug('Ignoring file', file.relative);
      }

      callback(null);
    } else {
      let path = file.path;
      const refName = file.basename;
      const innerMatch = path.match(/(.*[/\\]RESOURCES[/\\].*)(\.inner)[/\\](.*)/);

      if (innerMatch) {
        path = join(innerMatch[1], innerMatch[3].replace(/[/\\]/g, '.'));
      }

      const atFile = new AtviseFile({
        cwd: file.cwd,
        base: file.base,
        path,
        contents: file.contents,
      });

      const config = this._readReferenceFiles[refName];
      if (config) {
        atFile.getMetadata(); // ensure #_getMetadata gets called
        Object.assign(atFile._references,
          Object.entries(config.references || {})
            .reduce((result, [type, refs]) => Object.assign(result, {
              [type]: Array.isArray(refs) ? refs.map(v => new NodeId(v)) : new NodeId(refs),
            }), {})
        );

        delete this._readReferenceFiles[refName];
      } else if (file.relative.match(/\.var\./)) {
        callback(new Error(`Missing reference file, .${refName}.json should exist`));
        return;
      }

      callback(null, atFile);
    }
  }

  /**
   * `true` as the mapping transformer should infer references from config files.
   */
  get transformsReferenceConfigFiles() {
    return true;
  }

}
