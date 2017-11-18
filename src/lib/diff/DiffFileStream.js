import { StatusCodes } from 'node-opcua';
import QueueStream from '../stream/QueueStream';
import DiffFile from './DiffFile';

/**
 * A stream checks if the given {@link NodeId}s exist on the atvise server or on the filesystem,
 * depending on the stream direction
 */
export default class DiffFileStream extends QueueStream {

  /**
   * Creates a new DiffStream based on the given stream direction an some options.
   * @param {Object} The options to use.
   * @param {DiffFile.fileType} [options.fileType] The diff file type to create.
   */
  constructor(options = {}) {
    super(options);

    /**
     * The diff file type
     * @type {Map<vinyl~path, DiffItem>}
     */
    const fileType = options.fileType;

    if (!DiffFile.isValidFileType(fileType)) {
      throw new Error('DiffFileStream#constructor: Invalid file type');
    } else {
      this.itemType = fileType;
    }
  }

  /**
   * Returns an error message specifically for the given mapping item.
   * @param {AtviseFile} file The file to create the error message for
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `DiffFileStream#processErrorMessage: Error processing item ${file.nodeId.toString()}`;
  }

  /**
   * Creates {DiffFiles}'s for the given {AtviseFile}'s
   * @param {DiffFile} file The file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(file, handleErrors) {
    handleErrors(null, StatusCodes.Good, done => {
      this.push(new DiffFile(file, this.itemType));
      done();
    });
  }
}

