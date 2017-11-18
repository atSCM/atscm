import QueueStream from '../stream/QueueStream';
import Logger from 'gulplog';
import CombinedNodeFile from './CombinedNodeFile';
import { StatusCodes } from 'node-opcua';

/**
 * A stream that combines content {@link AtviseFile}s with type definition {@link AtviseFile}s
 * to {@link CombinedNodeFile}s.
 */
export default class NodeFileStream extends QueueStream {

  /**
   * Creates a new NodeFileStream.
   */
  constructor(options = {}) {
    super();


    /**
     * Defines wether the stream works with {CombinedNodeFiles} or {AtviseFile}s.
     * @type {Boolean}
     */
    this.createNodes = options.createNodes || false;


    /**
     * The file cache
     * @type {Map<node-opcua~NodeId, CombinedNodeFile>}
     */
    this.combinedFilesCache = {};
  }

  /**
   * Returns an error message specifically for the given atvise file
   * @param {AtviseFile} file The file to get
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `Error processing file with node id: ${file.nodeId.toString()}`;
  }

  /**
   * Mapps the given content {@link AtviseFiles}s with the given type definition{@link AtviseFiles}s.
   * @param {AtviseFile} file The file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(file, handleErrors) {
    const nodeId = file.nodeId;
    let combinedFile = {};

    if (!CombinedNodeFile.hasValidType(file)) {
      handleErrors(new Error(`NodeFileStream: File has invalid type:  ${nodeId.toString()}`));
    }

    if (this.combinedFilesCache.hasOwnProperty(nodeId)) {
      combinedFile = this.combinedFilesCache[nodeId];

      if (!combinedFile.addFile(file)) {
        handleErrors(new Error(`NodeFileStream: Duplicate file:  ${nodeId.toString()}`));
      }
    } else {
      this.combinedFilesCache[nodeId] = new CombinedNodeFile(file, this.createNodes);
      combinedFile = this.combinedFilesCache[nodeId];
    }

    if (combinedFile.isComplete) {
      handleErrors(null, StatusCodes.Good, done => {
        this.push(combinedFile);
        delete this.combinedFilesCache[nodeId];
        done();
      });
    } else {
      handleErrors(null, StatusCodes.Good, done => done());
    }
  }
}

