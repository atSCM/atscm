import { Buffer } from 'buffer';
import { readFile } from 'fs';
import Logger from 'gulplog';
import Transformer from '../lib/transform/Transformer';
import AtviseFile from '../lib/server/AtviseFile';
import NodeId from '../lib/server/NodeId';

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
export default class MappingTransformer extends Transformer {

  /**
   * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read. If a read file has a
   * non-standard type (definition) an additional `.rc` file is pushed holding this type.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(readResult, encoding, callback) {
    try {
      const file = AtviseFile.fromReadResult(readResult);

      if (file.relative.match(/\.var\./)) {
        const rc = file.clone();

        rc.extname = '';
        rc.basename = `.${rc.stem}.rc`;

        rc.contents = Buffer.from(JSON.stringify({
          typeDefinition: file.typeDefinition,
        }, null, '  '));

        this.push(rc);
      }

      callback(null, file);
    } catch (e) {
      Logger.error(`Unable to map ${mappingItem.nodeId.toString()}: ${e.message}`);
      Logger.debug(e);
      callback(null);
    }
  }

  /**
   * Writes an {@link AtviseFile} for each {@link vinyl~File} read.
   * @param {vinyl~File} file The raw file.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromFilesystem(file, encoding, callback) {
    if (file.isDirectory()) {
      callback(null);
    } else {
      const atFile = new AtviseFile({
        cwd: file.cwd,
        base: file.base,
        path: file.path,
        contents: file.contents,
      });

      callback(null, atFile);
    }
  }

}
