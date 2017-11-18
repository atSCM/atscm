import { StatusCodes } from 'node-opcua';
import QueueStream from '../stream/QueueStream';
import DiffItem from './DiffItem';

/**
 * A stream checks if the given {@link NodeId}s exist on the atvise server or on the filesystem,
 * depending on the stream direction.
 */
export default class DiffItemStream extends QueueStream {

  /**
   * Creates a new DiffItemStream.
   * @param {Object} The options to use.
   */
  constructor(options = {}) {
    super(options);

    /**
     * The diff item cache
     * @type {Map<vinyl~path, DiffItem>}
     */
    this.itemsCache = {};
  }

  /**
   * Returns an error message specifically for the given mapping item.
   * @param {DiffFile} file The diff file to create the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `DiffStream#processErrorMessage: Error processing item ${file.toString()}`;
  }


  /**
   * Combines the given DiffFiles to DiffItems.
   * @param {DiffFile} file The file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(file, handleErrors) {
    handleErrors(null, StatusCodes.Good, done => {
      const path = file.path;
      const itemsCache = this.itemsCache;

      if (Object.hasOwnProperty.call(itemsCache, path)) {
        const diffItem = itemsCache[path];

        diffItem.addFile(file);

        if (diffItem.isComplete) {
          this.push(diffItem);
          delete itemsCache[path];
        }
      } else {
        itemsCache[path] = new DiffItem(file);
      }

      done();
    });
  }
}

