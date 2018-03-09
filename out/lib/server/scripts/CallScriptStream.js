'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _NodeId = require('../../model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _CallMethodStream = require('./CallMethodStream');

var _CallMethodStream2 = _interopRequireDefault(_CallMethodStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that calls atvise server scripts for all passed nodes.
 * @abstract
 */
class CallScriptStream extends _CallMethodStream2.default {

  /**
   * The id of the *callScript* method.
   * @type {NodeId}
   */
  get methodId() {
    return new _NodeId2.default(_NodeId2.default.NodeIdType.STRING, 'AGENT.SCRIPT.METHODS.callScript', 1);
  }

  /**
   * **Must be implemented by all subclasses:** The id of the script to call.
   * @type {NodeId}
   * @abstract
   */
  get scriptId() {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Id of the script's base object.
   * @type {NodeId}
   */
  get scriptBaseId() {
    return this.scriptId.parent;
  }

  /**
   * Returns the parameters to call the script with for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The parameters passed to the script.
   */
  scriptParameters(file) {
    // eslint-disable-line no-unused-vars
    return {};
  }

  /**
   * Creates the raw method input arguments for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {node-opcua~Variant[]} Input arguments for the *callScript* method.
   */
  inputArguments(file) {
    const params = this.scriptParameters(file);
    const paramNames = Object.keys(params);

    return [{
      dataType: _nodeOpcua.DataType.NodeId,
      value: this.scriptId
    }, {
      dataType: _nodeOpcua.DataType.NodeId,
      value: this.scriptBaseId
    }, {
      dataType: _nodeOpcua.DataType.String,
      arrayType: _nodeOpcua.VariantArrayType.Array,
      value: paramNames
    }, {
      dataType: _nodeOpcua.DataType.Variant,
      arrayType: _nodeOpcua.VariantArrayType.Array,
      value: paramNames.map(key => params[key])
    }];
  }

  /**
   * Returns the error message logged if running the script fails.
   * @param {AtviseFile} file The processed file.
   * @return {string} The resulting error message.
   */
  processErrorMessage(file) {
    return `Error running script ${this.scriptId} for ${file.relative}`;
  }

  /**
   * Calls the script specified in {@link CallScriptStream#scriptId}. If the script does not exist
   * but could be imported by running `atscm import` a special status description is returned.
   * @param {vinyl~File} file The file being processed.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
  */
  processChunk(file, handleErrors) {
    super.processChunk(file, (err, status, success) => {
      const processedStatus = status;

      const atscmScript = this.scriptId.value.match(/SERVERSCRIPTS\.atscm\.(.*)/);
      if (status === _nodeOpcua.StatusCodes.BadMethodInvalid && atscmScript) {
        processedStatus.description = `The '${atscmScript[1]}' script does not exist.
- Did you forget to run 'atscm import'?`;
      }

      handleErrors(err, processedStatus, success);
    });
  }

}
exports.default = CallScriptStream;
//# sourceMappingURL=CallScriptStream.js.map