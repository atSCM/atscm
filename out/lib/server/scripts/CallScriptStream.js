"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _variant = require("node-opcua/lib/datamodel/variant");

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _NodeId = _interopRequireDefault(require("../../model/opcua/NodeId"));

var _CallMethodStream = _interopRequireDefault(require("./CallMethodStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that calls atvise server scripts for all passed nodes.
 * @abstract
 */
class CallScriptStream extends _CallMethodStream.default {
  /**
   * The id of the *callScript* method.
   * @type {NodeId}
   */
  get methodId() {
    return new _NodeId.default(_NodeId.default.NodeIdType.STRING, 'AGENT.SCRIPT.METHODS.callScript', 1);
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
    // eslint-disable-line @typescript-eslint/no-unused-vars
    return {};
  }
  /**
   * Creates the raw method input arguments for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {?node-opcua~Variant[]} Input arguments for the *callScript* method.
   */


  inputArguments(file) {
    const params = this.scriptParameters(file);

    if (params === null) {
      return null;
    }

    const paramNames = Object.keys(params);
    return [{
      dataType: _variant.DataType.NodeId,
      value: this.scriptId
    }, {
      dataType: _variant.DataType.NodeId,
      value: this.scriptBaseId
    }, {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Array,
      value: paramNames
    }, {
      dataType: _variant.DataType.Variant,
      arrayType: _variant.VariantArrayType.Array,
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

      if (status === _opcua_status_code.StatusCodes.BadMethodInvalid && atscmScript) {
        processedStatus.description = `The '${atscmScript[1]}' script does not exist.
- Did you forget to run 'atscm import'?`;
      }

      handleErrors(err, processedStatus, success);
    });
  }

}

exports.default = CallScriptStream;
//# sourceMappingURL=CallScriptStream.js.map