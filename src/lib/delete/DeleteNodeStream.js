import Logger from 'gulplog';
import { StatusCodes, DataType, Variant } from 'node-opcua';
import CallScriptStream from '../script/CallScriptStream';
import NodeId from '../ua/NodeId';


/**
 * Definition for the parameter name of the Delete node script
 * @type {String}
 */
const DeleteNodeScriptParameterName = 'nodeId';


/**
 * A stream that deletes atvise server nodes for the given node ids.
 */
export default class DeleteNodeStream extends CallScriptStream {

  /**
   * Creates a new CreateNodeStream.
   */
  constructor() {
    super(new NodeId('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.DeleteNode'));
  }


  /**
   * Returns an error message specifically for the given combined file.
   * @param {NodeId} nodeId The nodeId to create the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(nodeId) {
    return `Error deleting node:  ${nodeId.toString()}`;
  }

  /**
   * Creates the parameter object for creating nodes.
   * @param {NodeId} nodeId The nodeId to use as parameter
   * parameter object for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(nodeId) {
    const paramValue = new Variant({
      dataType: DataType.String,
      value: nodeId.toString(),
    });

    return { paramNames: [DeleteNodeScriptParameterName], paramValues: [paramValue] };
  }

  /**
   * Handles the call script methods callback.
   * @param {Array} results The result of the call.
   * @param {node} nodeId The nodeId to process.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, nodeId, handleErrors) {
    const outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value !== StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      const deleteSuccessful = outputArguments[3].value[0].value === StatusCodes.Good.value;

      if (deleteSuccessful) {
        Logger.debug(`Successfully deleted node ${nodeId.toString()}`);
      } else {
        Logger.error(`Error deleting node ${nodeId.toString()}.`,
          'Node does not exist in atvise server address space');
      }
    }
    handleErrors(null, StatusCodes.Good, done => done());
  }

}
