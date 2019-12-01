"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _QueueStream = _interopRequireDefault(require("../QueueStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that calls an OPC-UA method for all input files.
 * @abstract
 */
class CallMethodStream extends _QueueStream.default {
  /**
   * **Must be implemented in all subclasses:** The {@link NodeId} of the method to call.
   * @type {NodeId} The method's id.
   */
  get methodId() {
    throw new Error('Must be implemented in all subclasses');
  }
  /**
   * The {@link NodeId} of the object from which the method should get called. Defaults to the value
   * of {@link NodeId#parent} of {@link CallMethodStream#methodId}.
   * @type {NodeId} The call-object's id.
   */


  get methodBaseId() {
    return this.methodId.parent;
  }
  /**
   * The input arguments the method should be called with for a file. Needs to be overridden by
   * subclasses in most cases. Returning `null` indicates no method call is needed.
   * @param {vinyl~File} file The file beeing processed.
   * @return {?node-opcua~Variant[]} The resulting input arguments.
   */
  // eslint-disable-next-line no-unused-vars


  inputArguments(file) {
    return [];
  }
  /**
   * Creates a call method request object for a file.
   * @param {vinyl~File} file The file beeing processed.
   * @return {?node-opcua~CallMethodRequest} The resulting call request.
   */


  callRequest(file) {
    const args = this.inputArguments(file);

    if (args === null) {
      return null;
    }

    return {
      objectId: this.methodBaseId,
      methodId: this.methodId,
      inputArguments: args
    };
  }
  /**
   * **Must be implemented by all subclasses:** If the method call returns a status code of
   * *{@link node-opcua~StatusCodes}.Good*, this method decides if the output matches the expected
   * results.
   * @param {vinyl~File} file The file beeing processed.
   * @param {node-opcua~Variant[]} outputArgs The output arguments.
   * @param {function(err: Error)} callback Call this method with an error to indicate the method
   * call didn't work as expected.
   */
  // eslint-disable-next-line no-unused-vars


  handleOutputArguments(file, outputArgs, callback) {
    throw new Error('Must be implemented in all subclasses');
  }
  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~File} file The file to generate the error message for.
   * @return {string} The specific error message.
   */


  processErrorMessage(file) {
    return `Error running ${this.methodId.toString()} for ${file.relative}`;
  }
  /**
   * Performs an opcua method call for the given file.
   * @param {vinyl~File} file The file being processed.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
   */


  processChunk(file, handleErrors) {
    try {
      const request = this.callRequest(file);

      if (!request) {
        handleErrors(null, _opcua_status_code.StatusCodes.Good, done => done());
        return;
      }

      this.session.call([request], (err, [result] = []) => {
        if (err) {
          handleErrors(err);
        } else if (result.statusCode.value !== _opcua_status_code.StatusCodes.Good.value) {
          handleErrors(err, result.statusCode, done => done());
        } else {
          this.handleOutputArguments(file, result.outputArguments, outputError => {
            handleErrors(outputError, _opcua_status_code.StatusCodes.Good, done => done());
          });
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}

exports.default = CallMethodStream;
//# sourceMappingURL=CallMethodStream.js.map