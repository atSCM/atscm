import QueueStream from './QueueStream';
import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua';

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
   * Adds the data of read {node-opcua~DataValue}s for given {@link MappingItem}s.
   * @param {MappingItem} mappingItem The mappingItem to process
   * If the proccessed item is not a type definition, the node value will be read from the atvise server
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(mappingItem, handleErrors) {
    let nodeId = mappingItem.readNodeConfig.nodeId;

    if (!mappingItem.isReadNodeConfig) {
      this.push(mappingItem);
      handleErrors(err, StatusCodes.Good, done => done());
    } else {

      this.session.read([{nodeId}], (err, nodesToRead, results) => {
        if(! err && (! results || results.length === 0)) {
          handleErrors(new Error('No results'));
        } else {
          handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
            let dataValue = results[0];

            if (dataValue.value == null) {
              Logger.warn(`Unable to read value of node:  ${nodeId.toString()}`);
            } else {
              mappingItem.addDataValueToReadNodeConfig(dataValue);
              this.push(mappingItem);
            }

            done();
          });
        }
      });
    }
  }
}

