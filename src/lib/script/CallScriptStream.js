import { DataType, StatusCodes, VariantArrayType } from 'node-opcua';
import QueueStream from '../stream/QueueStream';
import NodeId from '../ua/NodeId';
import checkType from '../../util/validation';

/**
 * Call script node id
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodId = new NodeId('ns=1;s=AGENT.SCRIPT.METHODS.callScript');

/**
 * Base node id for callscript node
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodBaseNodeId = CallScriptMethodId.parentNodeId;


/**
 * A stream that processes atvise server requests in parallel.
 * @abstract
 */
export default class CallScriptStream extends QueueStream {

  constructor(targetScriptId) {
    if (!checkType(targetScriptId, NodeId)) {
      throw new Error('CallScriptStream#constructor: Given targetScriptId is undefined' +
        ' or has invalid type!');
    }

    super();
    this.targetScriptId = targetScriptId;
    this.targetScriptBaseId = targetScriptId.parentNodeId;
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {Object} The resulting call script object.
   */
  createCallObject(combinedNodeFile) {
    const parameters = this.createParameters(combinedNodeFile);

    return {
      objectId: CallScriptMethodBaseNodeId.toString(),
      methodId: CallScriptMethodId.toString(),
      inputArguments: [
        {
          dataType: DataType.NodeId,
          value: this.targetScriptId,
        },
        {
          dataType: DataType.NodeId,
          value: this.targetScriptBaseId,
        },
        {
          dataType: DataType.String,
          arrayType: VariantArrayType.Array,
          value: parameters.paramNames,
        },
        {
          dataType: DataType.Variant,
          arrayType: VariantArrayType.Array,
          value: parameters.paramValues,
        },
      ],
    };
  }

  /**
   * Creates the script parameters for the given chunk
   * @param {*} chunk The chunk to create the parameter object for
   * the error message for.
   * @return {Object} The resulting script parameters. The object always needs to contain a
   * 'paramNames' and a 'paramValues' array as property
   */
  createParameters(chunk) { // eslint-disable-line no-unused-vars
    throw new Error('CallScriptStream#createParameters must be implemented by all subclasses');
  }

  /**
   * Handles the node-opcua call script method callback
   * @param {Error} err If the call throw an error or not
   * @param {Array} results The result of the call
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   * @abstract
   */
  handleCallback(err, results, handleErrors) { // eslint-disable-line no-unused-vars
    throw new Error('CallScriptStream#handleCallback must be implemented by all subclasses');
  }

  /**
   * Performs opcua method calls for the given call object configuration
   * @param {*} chunk The chunk being processed.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(chunk, handleErrors) {
    const callObj = this.createCallObject(chunk);

    try {
      this.session.call([callObj], (err, results) => {
        if (err) {
          handleErrors(err);
        } else if (results[0].statusCode.value !== StatusCodes.Good.value) {
          handleErrors(err, results[0].statusCode, done => done());
        } else {
          this.handleCallback(results, chunk, handleErrors);
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }
}

