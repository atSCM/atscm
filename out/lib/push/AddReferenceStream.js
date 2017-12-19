'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _nodeOpcua = require('node-opcua');

var _CallScriptStream = require('../script/CallScriptStream');

var _CallScriptStream2 = _interopRequireDefault(_CallScriptStream);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Definition for the parameter name of the CreateNode script
 * @type {Array}
 */
const AddReferencesScriptParameterName = 'paramObjString';

/**
 * A stream that adds node references for the given reference config {AtviseFile}'s
 * on the atvise server.
 */
class AddReferenceStream extends _CallScriptStream2.default {
  /**
   * Creates a new CreateNodeStream
   */
  constructor() {
    super(new _NodeId2.default('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences'));
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {AtviseFile} referenceConfigFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(referenceConfigFile) {
    return `Error adding references:  ${referenceConfigFile.nodeId.toString()}`;
  }

  /**
   * Creates the parameter object for creating nodes
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to create the call
   * parameter object for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(referenceConfigFile) {
    const paramObj = {
      nodeId: referenceConfigFile.nodeId,
      references: JSON.parse(referenceConfigFile.value)
    };

    const paramValue = new _nodeOpcua.Variant({
      dataType: _nodeOpcua.DataType.String,
      value: JSON.stringify(paramObj)
    });

    return { paramNames: [AddReferencesScriptParameterName], paramValues: [paramValue] };
  }

  /**
   * Handles the call script methods callback
   * @param {Array} results The result of the call
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, referenceConfigFile, handleErrors) {
    const nodeId = referenceConfigFile.nodeId;
    const outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value !== _nodeOpcua.StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      const failedAttempts = outputArguments[3].value[0].value;

      if (failedAttempts) {
        if (failedAttempts.length > 0) {
          failedAttempts.map(targetNodeId => {
            _gulplog2.default.error(`Adding reference from ${nodeId} to ${targetNodeId} failed`);
            return false;
          });
        } else {
          _gulplog2.default.debug(`Successfully created references for ${nodeId}`);
        }
      }
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
    }
  }
}
exports.default = AddReferenceStream;
//# sourceMappingURL=AddReferenceStream.js.map