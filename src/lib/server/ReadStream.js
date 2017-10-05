import QueueStream from './QueueStream';

/**
 * A stream that reads atvise server nodes for the {@link node-opcua~ReferenceDescription}s passed.
 */
export default class ReadStream extends QueueStream {

  /**
   * Returns an error message specifically for the given reference description.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to get
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(mappingItem) {
    return `ReadStream#processErrorMessage: Error processing item ${mappingItem.nodeId.toString()}`;
  }

  /**
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to read
   * the atvise server node for.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(mappingItem, handleErrors) {
    let nodeId = mappingItem.nodeId;

    if (!mappingItem.shouldBeRead) {
      this.push(mappingItem);
      handleErrors(null, StatusCodes.Good, done => done());
    } else {

      this.session.read([{nodeId}], (err, nodesToRead, results) => {
        if(! err && (! results || results.length === 0)) {
          handleErrors(new Error('No results'));
        } else {
          handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
            let dataValue = results[0];

            if (dataValue.value == null) {
              Logger.error(`Unable to read value of node:  ${nodeId.toString()}`);
            } else {
              mappingItem.createConfigItemFromDataValue(dataValue);
              this.push(mappingItem);
            }

            done();
          });
          done();
        });
      }
    });
  }

}

/**
 * @typedef {Object} ReadStream.ReadResult
 * @property {NodeId} nodeId The read node's id.
 * @property {?node-opcua~DataValue} value The read value.
 * @property {Object} referenceDescription Additional info on the read node.
 * @property {Date} mtime The timestamp the node's value last changed.
 */
