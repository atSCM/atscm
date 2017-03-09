import { Buffer } from 'buffer';
import { readFile } from 'fs';
import { basename, join } from 'path';
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
      Logger.warn(`Unable to map ${readResult.nodeId.toString()}`, e.message);
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

      if (file.relative.match(/\.var\./)) {
        const rcFile = file.clone({ contents: false });
        rcFile.extname = '';
        rcFile.basename = `.${rcFile.stem}.rc`;

        readFile(rcFile.path, 'utf8', (err, data) => {
          try {
            const rc = JSON.parse(data);
            atFile._typeDefinition = new NodeId(rc.typeDefinition);

            callback(null, atFile);
          } catch (e) {
            Logger.error(`Unable to get runtime configuration for ${file.relative}`);
            callback(err || e);
          }
        });
      } else {
        callback(null, atFile);
      }
    }
  }

}
