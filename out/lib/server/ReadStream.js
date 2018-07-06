'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _opcua_status_code = require('node-opcua/lib/datamodel/opcua_status_code');

var _nodeclass = require('node-opcua/lib/datamodel/nodeclass');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

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
    return `Error reading node ${referenceDescription.nodeId.value}`;
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
  processChunk({ nodeClass, nodeId, references, parent }, handleErrors) {
    if (nodeClass.value === _nodeclass.NodeClass.Variable.value) {
      this.session.read([{ nodeId }], (err, nodesToRead, results) => {
        if (err) {
          const status = results && results.length && results[0].statusCode;
          handleErrors(err, status);
        } else if (!results || results.length === 0) {
          handleErrors(new Error('No results'));
        } else {
          let status = results[0].statusCode;

          if (status !== _opcua_status_code.StatusCodes.Good) {
            const id = nodeId.value;

            if (results[0].value) {
              status = _opcua_status_code.StatusCodes.Good;
              _gulplog2.default.debug(`Node ${id} has bad status: ${results[0].statusCode.description}`);
            } else {
              handleErrors(err, _opcua_status_code.StatusCodes.Good, done => {
                _gulplog2.default.error(`Unable to read ${id}: ${results[0].statusCode.description}`);
                done();
              });
              return;
            }
          }

          handleErrors(err, status, done => {
            this.push({
              nodeClass,
              nodeId,
              references,
              parent,
              value: results[0].value,
              mtime: results[0].sourceTimestamp
            });
            done();
          });
        }
      });
    } else {
      handleErrors(null, _opcua_status_code.StatusCodes.Good, done => {
        this.push({
          nodeClass,
          nodeId,
          references,
          parent
        });

        done();
      });
    }
  }

}
exports.default = ReadStream;
//# sourceMappingURL=ReadStream.js.map