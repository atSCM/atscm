import Logger from 'gulplog';
import { NodeClass } from 'node-opcua';
import Transformer from '../lib/transform/Transformer';
import AtviseFile from '../lib/server/AtviseFile';
import NodeId from '../lib/model/opcua/NodeId';

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
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(readResult, encoding, callback) {
    try {
      const file = AtviseFile.fromReadResult(readResult);

      if (readResult.parent && readResult.parent.value.match(/\.RESOURCES\//)) {
        const relativePath = readResult.nodeId.value.split(readResult.parent.value)[1];

        if (relativePath[0] === '.') {
          file.path = file.path.split(`${readResult.parent.filePath}.`)
            .join(`${readResult.parent.filePath}.inner/`);
        }
      }

      if (readResult.nodeClass === NodeClass.Variable) {
        const unmappedReferences = Object.assign({}, file.references);

        if (unmappedReferences.toParent === 'HasComponent') {
          delete unmappedReferences.toParent;
        }

        if (!file.relative.match(/\.var\./)) {
          delete unmappedReferences.HasTypeDefinition;
        }

        if (Object.keys(unmappedReferences).length) {
          const rc = file.clone();

          rc.basename = `.${rc.basename}.json`;

          rc.contents = Buffer.from(JSON.stringify({
            references: unmappedReferences,
          }, null, '  '));

          this.push(rc);
        }
      }

      callback(null, file);
    } catch (e) {
      Logger[e.message === 'no value' ? 'debug' : 'warn'](
        `Unable to map ${readResult.nodeId.value}: ${e.message}`
      );
      Logger.debug(e);

      callback(null);
    }
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
      const innerMatch = path.match(/(.*\/RESOURCES\/.*)(\.inner)\/(.*)/);

      if (innerMatch) {
        path = `${innerMatch[1]}/${innerMatch[3].replace(/\//g, '.')}`;
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
