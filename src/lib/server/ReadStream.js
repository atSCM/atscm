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
    if (nodeClass.value === NodeClass.Variable.value) {
      this.session.read([{ nodeId }], (err, nodesToRead, results) => {
        if (err) {
          const status = results && results.length && results[0].statusCode;
          handleErrors(err, status, done => done());
        } else if (!results || results.length === 0) {
          handleErrors(new Error('No results'));
        } else if (results[0].statusCode === StatusCodes.BadServerNotConnected) {
          handleErrors(err, StatusCodes.Good, done => {
            Logger.warn(`${
              nodeId.value
            } could not be read because it's datasource is not connected`);
            done();
          });
        } else {
          handleErrors(err, results[0].statusCode, done => {
            this.push({
              nodeClass,
              nodeId,
              references,
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
        });

        done();
      });
    }
  }

}
