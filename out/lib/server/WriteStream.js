'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('./QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 */
class WriteStream extends _QueueStream2.default {

  /**
   * The error message to use when writing a file fails.
   * @param {AtviseFile} file The file being processed.
   * @return {String} The error message to use.
   */
  processErrorMessage(file) {
    return `Error writing ${file.nodeId.toString()}`;
  }

  /**
   * Writes an {@link AtviseFile} to it's corresponding node on atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value
      }, (err, statusCode) => {
        if (statusCode === _nodeOpcua.StatusCodes.BadUserAccessDenied) {
          _gulplog2.default.warn(`Error writing node ${file.nodeId.toString()}: Make sure it is not opened in atvise builder`);
          handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
        } else {
          handleErrors(err, statusCode, done => {
            this.push(file);
            done();
          });
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
exports.default = WriteStream;