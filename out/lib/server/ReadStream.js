'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('./QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that reads atvise server nodes for the {@link node-opcua~ReferenceDescription}s passed.
 */
class ReadStream extends _QueueStream2.default {

  /**
   * Returns an error message specifically for the given reference description.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to get
   * the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(referenceDescription) {
    return `Error reading node ${referenceDescription.nodeId.toString()}`;
  }

  /**
   * Returns a {@link ReadStream.ReadResult} for the given {@link NodeStream.BrowseResult}.
   * @param {NodeStream.BrowseResult} browseResult The browse result to process:
   *  - If {@link NodeStream.BrowseResult#nodeClass} equals {@link node-opcua~NodeClass}*.Variable*
   *    the browse result is passed as-is to piped streams.
   *  - Otherwise the node's value is read from *atvise server*.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk({ nodeClass, nodeId, references }, handleErrors) {
    if (nodeClass.value === _nodeOpcua.NodeClass.Variable.value) {
      this.session.read([{ nodeId }], (err, nodesToRead, results) => {
        if (!err && (!results || results.length === 0)) {
          handleErrors(new Error('No results'));
        } else {
          handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
            this.push({
              nodeClass,
              nodeId,
              references,
              value: results[0].value,
              mtime: results[0].sourceTimestamp
            });
            done();
          });
        }
      });
    } else {
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => {
        this.push({
          nodeClass,
          nodeId,
          references
        });

        done();
      });
    }
  }

}
exports.default = ReadStream;
//# sourceMappingURL=ReadStream.js.map