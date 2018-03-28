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
   * @return {string} The error message to use.
   */
  processErrorMessage(file) {
    return `Error writing ${file.nodeId.value}`;
  }

  /**
   * Writes an {@link AtviseFile} to it's corresponding node on atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    if (file.nodeClass.value !== _nodeOpcua.NodeClass.Variable.value) {
      // Non-variable nodes are just pushed
      this.push(file);
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
      return;
    }

    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value
      }, (err, statusCode) => {
        if (statusCode === _nodeOpcua.StatusCodes.BadUserAccessDenied || statusCode === _nodeOpcua.StatusCodes.BadNotWritable) {
          _gulplog2.default.warn(`Error writing node ${file.nodeId.value}
- Make sure it is not opened in atvise builder
- Make sure the corresponding datasource is connected`);
          handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
        } else if (statusCode === _nodeOpcua.StatusCodes.BadNodeIdUnknown) {
          _gulplog2.default.debug(`Node ${file.nodeId.value} does not exist: Attempting to create it...`);

          handleErrors(err, _nodeOpcua.StatusCodes.Good, done => {
            this.push(file);
            done();
          });
        } else {
          handleErrors(err, statusCode, done => done());
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
exports.default = WriteStream; /* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */
//# sourceMappingURL=WriteStream.js.map