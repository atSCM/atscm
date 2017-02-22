'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _AtviseFile = require('../lib/server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class MappingTransformer extends _Transformer2.default {

  /**
   * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(readResult, encoding, callback) {
    try {
      callback(null, _AtviseFile2.default.fromReadResult(readResult));
    } catch (e) {
      _gulplog2.default.warn(`Unable to map ${readResult.nodeId.toString()}`, e.message);
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
    callback(null, new _AtviseFile2.default({
      cwd: file.cwd,
      base: file.base,
      path: file.path,
      contents: file.contents
    }));
  }

}
exports.default = MappingTransformer;