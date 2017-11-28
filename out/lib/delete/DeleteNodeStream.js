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
 * Definition for the parameter name of the Delete node script
 * @type {String}
 */
const DeleteNodeScriptParameterName = 'nodeId';

/**
 * A stream that deletes atvise server nodes for the given node ids.
 */
class DeleteNodeStream extends _CallScriptStream2.default {

  /**
   * Creates a new CreateNodeStream
   */
  constructor() {
    super(new _NodeId2.default('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.DeleteNode'));
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {NodeId} nodeId The nodeId to create the error message for
   * @return {String} The specific error message.
   */
  processErrorMessage(nodeId) {
    return `Error deleting node:  ${nodeId.toString()}`;
  }

  /**
   * Creates the parameter object for creating nodes
   * @param {NodeId} nodeId The nodeId to use as parameter
   * parameter object for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(nodeId) {
    const paramValue = new _nodeOpcua.Variant({
      dataType: _nodeOpcua.DataType.String,
      value: nodeId.toString()
    });

    return { paramNames: [DeleteNodeScriptParameterName], paramValues: [paramValue] };
  }

  /**
   * Handles the call script methods callback
   * @param {Array} results The result of the call
   * @param {node} nodeId The nodeId to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, nodeId, handleErrors) {
    const outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value !== _nodeOpcua.StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      const deleteSuccessful = outputArguments[3].value[0].value === _nodeOpcua.StatusCodes.Good.value;

      if (deleteSuccessful) {
        _gulplog2.default.debug(`Successfully deleted node ${nodeId.toString()}`);
      } else {
        _gulplog2.default.error(`Error deleting node ${nodeId.toString()}.`, 'Node does not exist in atvise server address space');
      }
    }
    handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
  }
}
exports.default = DeleteNodeStream;
//# sourceMappingURL=DeleteNodeStream.js.map