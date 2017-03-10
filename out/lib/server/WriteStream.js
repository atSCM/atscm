'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that writes all read {@link AtviseFile}s to atvise server.
 */
class WriteStream extends _Stream2.default {

  /**
   * Writes a file to atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: ?Error, file: ?AtviseFile)} callback Called with the error that occurred
   * or the successfully written file.
   */
  writeFile(file, callback) {
    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value
      }, err => {
        if (err) {
          callback(err);
        } else {
          callback(null, file);
        }
      });
    } catch (e) {
      callback(new Error(`Error writing node ${file.nodeId.toString()}: ${e.message}`));
    }
  }

  /**
   * Calls {@link WriteStream#writeFile} once the session is open.
   * @param {AtviseFile} file The file to write.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, file: ?AtviseFile)} callback Called with the error that occurred
   * or the successfully written file.
   * @listens {Session} Listens to the `session-open`-event if the session is not open yet.
   */
  _transform(file, enc, callback) {
    if (this.session) {
      this.writeFile(file, callback);
    } else {
      this.once('session-open', () => this.writeFile(file, callback));
    }
  }

}
exports.default = WriteStream;