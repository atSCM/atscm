'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _validation = require('../../util/validation');

var _validation2 = _interopRequireDefault(_validation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Call script node id
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodId = new _NodeId2.default('ns=1;s=AGENT.SCRIPT.METHODS.callScript');

/**
 * Base node id for callscript node
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodBaseNodeId = CallScriptMethodId.parentNodeId;

/**
 * A stream that processes atvise server requests in parallel.
 * @abstract
 */
class CallScriptStream extends _QueueStream2.default {

  constructor(targetScriptId) {
    if (!(0, _validation2.default)(targetScriptId, _NodeId2.default)) {
      throw new Error('CallScriptStream#constructor: Given targetScriptId is undefined' + ' or has invalid type!');
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
      inputArguments: [{
        dataType: _nodeOpcua.DataType.NodeId,
        value: this.targetScriptId
      }, {
        dataType: _nodeOpcua.DataType.NodeId,
        value: this.targetScriptBaseId
      }, {
        dataType: _nodeOpcua.DataType.String,
        arrayType: _nodeOpcua.VariantArrayType.Array,
        value: parameters.paramNames
      }, {
        dataType: _nodeOpcua.DataType.Variant,
        arrayType: _nodeOpcua.VariantArrayType.Array,
        value: parameters.paramValues
      }]
    };
  }

  /**
   * Creates the script parameters for the given chunk
   * @param {*} chunk The chunk to create the parameter object for
   * the error message for.
   * @return {Object} The resulting script parameters. The object always needs to contain a
   * 'paramNames' and a 'paramValues' array as property
   */
  createParameters(chunk) {
    // eslint-disable-line no-unused-vars
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
  handleCallback(err, results, handleErrors) {
    // eslint-disable-line no-unused-vars
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
        } else if (results[0].statusCode.value !== _nodeOpcua.StatusCodes.Good.value) {
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
exports.default = CallScriptStream;
//# sourceMappingURL=CallScriptStream.js.map