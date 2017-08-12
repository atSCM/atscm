import QueueStream from './QueueStream';
import { StatusCodes, NodeClass} from 'node-opcua';

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
  processErrorMessage(referenceDescription) {
    return `Error reading node ${referenceDescription.nodeId.toString()}`;
  }

  /**
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {node-opcua~ReferenceDescription} typeDefResult The type definition stream result to process
   * If the proccessed item is not a type definition, the node value will be read from the atvise server
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(typeDefResult, handleErrors) {
    const nodeId = typeDefResult.nodeId;

    if (typeDefResult.isTypeDef) {
        this.push(typeDefResult);
        this._processNextChunk(typeDefResult);
    } else {
      this.session.read([{nodeId}], (err, nodesToRead, results) => {
        if(! err && (! results || results.length === 0)) {
          handleErrors(new Error('No results'));
        } else {
          handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
            let readValue = results[0].value;
            this.push({
              nodeId,
              browseName: typeDefResult.browseName.name,
              value: readValue.value,
              dataType: readValue.$dataType,
              arrayType: readValue.$arrayType,
              typeDefinition: typeDefResult.typeDefinition,
              mtime: results[0].sourceTimestamp,
            });
            done();
        });
      }
      });
    }
  }
}

/**
 * @typedef {Object} ReadStream.ReadResult
 * @property {NodeId} nodeId The read node's id.
 * @property {?node-opcua~value} value The read value.
 * @property {?node-opcua~dataType} dataType The data type of the read value.
 * @property {?node-opcua~arrayType} arrayType The array type of the read value.
 * @property {Object} referenceDescription Additional info on the read node.
 * @property {Date} mtime The timestamp the node's value last changed.
 */
