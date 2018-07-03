import { StatusCodes, NodeClass } from 'node-opcua';
import Logger from 'gulplog';
import QueueStream from './QueueStream';

/**
 * A stream that reads atvise server nodes for the {@link node-opcua~ReferenceDescription}s passed.
 */
export default class ReadStream extends QueueStream {

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
    if (nodeClass.value === NodeClass.Variable.value) {
      this.session.read([{ nodeId }], (err, nodesToRead, results) => {
        if (err) {
          const status = results && results.length && results[0].statusCode;
          handleErrors(err, status);
        } else if (!results || results.length === 0) {
          handleErrors(new Error('No results'));
        } else {
          let status = results[0].statusCode;

          if (status !== StatusCodes.Good) {
            if (results[0].value) {
              status = StatusCodes.Good;
              Logger.debug(`Node ${nodeId.value} has bad status: ${results[0].statusCode.description}`);
            } else {
              handleErrors(err, StatusCodes.Good, done => {
                Logger.error(`Unable to read ${nodeId.value}: ${results[0].statusCode.description}`);
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
              mtime: results[0].sourceTimestamp,
            });
            done();
          });
        }
      });
    } else {
      handleErrors(null, StatusCodes.Good, done => {
        this.push({
          nodeClass,
          nodeId,
          references,
          parent,
        });

        done();
      });
    }
  }

}
