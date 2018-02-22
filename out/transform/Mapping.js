'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _AtviseFile = require('../lib/server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

var _NodeId = require('../lib/model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
class MappingTransformer extends _Transformer2.default {

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
      const file = _AtviseFile2.default.fromReadResult(readResult);

      if (file.relative.match(/\.var\./)) {
        const rc = file.clone();

        rc.extname = '';
        rc.basename = `.${rc.stem}.rc`;

        rc.contents = Buffer.from(JSON.stringify({
          typeDefinition: file.typeDefinition
        }, null, '  '));

        this.push(rc);
      }

      callback(null, file);
    } catch (e) {
      _gulplog2.default[e.message === 'no value' ? 'debug' : 'warn'](`Unable to map ${readResult.nodeId.toString()}: ${e.message}`);
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

      if (file.relative.match(/\.var\./)) {
        const rcFile = file.clone({ contents: false });
        rcFile.extname = '';
        rcFile.basename = `.${rcFile.stem}.rc`;

        (0, _fs.readFile)(rcFile.path, 'utf8', (err, data) => {
          try {
            const rc = JSON.parse(data);
            atFile._typeDefinition = new _NodeId2.default(rc.typeDefinition);

            callback(null, atFile);
          } catch (e) {
            _gulplog2.default.error(`Unable to get runtime configuration for ${file.relative}`);
            callback(err || e);
          }
        });
      } else {
        callback(null, atFile);
      }
    }
  }

}
exports.default = MappingTransformer;
//# sourceMappingURL=Mapping.js.map