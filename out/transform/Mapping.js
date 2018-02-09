'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _AtviseFile = require('../lib/mapping/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
class MappingTransformer extends _Transformer2.default {

  /**
   * Writes an {@link AtviseFile} for each given {@link MappingItem}.
   * @param {MappingItem} mappingItem The mapping item to create the file for.
   * @param {string} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(mappingItem, encoding, callback) {
    try {
      const file = _AtviseFile2.default.fromMappingItem(mappingItem);

      callback(null, file);
    } catch (e) {
      _gulplog2.default.error(`Unable to map ${mappingItem.nodeId.toString()}: ${e.message}`);
      _gulplog2.default.debug(e);
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
      const atFile = new _AtviseFile2.default({
        cwd: file.cwd,
        base: file.base,
        path: file.path,
        contents: file.contents
      });

      callback(null, atFile);
    }
  }

}
exports.default = MappingTransformer;
//# sourceMappingURL=Mapping.js.map