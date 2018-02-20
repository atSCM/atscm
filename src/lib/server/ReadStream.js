/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */

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
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to read
   * the atvise server node for.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(referenceDescription, handleErrors) {
    const nodeId = referenceDescription.nodeId;

    this.session.read([{ nodeId }], (err, nodesToRead, results) => {
      if (!err && (!results || results.length === 0)) {
        handleErrors(new Error('No results'));
      } else {
        handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
          this.push({
            nodeId,
            value: results[0].value,
            referenceDescription,
            mtime: results[0].sourceTimestamp,
          });
          done();
        });
      }
    });
  }

}
