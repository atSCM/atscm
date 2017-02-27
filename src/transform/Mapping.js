import Logger from 'gulplog';
import Transformer from '../lib/transform/Transformer';
import AtviseFile from '../lib/server/AtviseFile';

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
export default class MappingTransformer extends Transformer {

  /**
   * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(readResult, encoding, callback) {
    try {
      callback(null, AtviseFile.fromReadResult(readResult));
    } catch (e) {
      Logger.warn(`Unable to map ${readResult.nodeId.toString()}`, e.message);
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
      callback(null, new AtviseFile({
        cwd: file.cwd,
        base: file.base,
        path: file.path,
        contents: file.contents,
      }));
    }
  }

}
