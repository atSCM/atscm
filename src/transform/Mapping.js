import Logger from 'gulplog';
import Transformer from '../lib/transform/Transformer';
import AtviseFile from '../lib/mapping/AtviseFile';

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
export default class MappingTransformer extends Transformer {

  /**
   * Writes an {@link AtviseFile} for each given {@link MappingItem}.
   * @param {MappingItem} mappingItem The mapping item to create the file for.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(mappingItem, encoding, callback) {
    try {
      const file = AtviseFile.fromMappingItem(mappingItem);

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
   * @param {string} encoding The encoding used.
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
