import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua';
import QueueStream from '../stream/QueueStream';

/**
 * A stream that writes all read {@link CombinedNodeFiles}s to their corresponding nodes on atvise server.
 */
export default class WriteStream extends QueueStream {


  /**
   * Creates a new WriteStream based on a source file stream.
   * @param {Object} options The stream configuration options.
   */
  constructor(options = {}) {

    super();

    /**
     * Defines wether the stream works with {CombinedNodeFiles} or {AtviseFile}s.
     * @type {Boolean}
     */
    this.createNodes = options.createNodes || false;
  }


  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error processing file:  ${combinedNodeFile.contentFile.nodeId.toString()}`;
  }

  /**
   * Writes {@link CombinedNodeFile.contentFile}'s values to the corresponding nodes on the atvise server.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(combinedNodeFile, handleErrors) {
    const contentFile = combinedNodeFile.contentFile;

    if (this.createNodes && combinedNodeFile.isTypeDefOnlyFile) {
      this.push(combinedNodeFile);
      handleErrors(null, StatusCodes.Good, done => done());
    } else {
      try {
        this.session.writeSingleNode(contentFile.nodeId.toString(), {
          dataType: contentFile.dataType,
          arrayType: contentFile.arrayType,
          value: contentFile.value,
        }, (err, statusCode) => {
          if (statusCode === StatusCodes.BadUserAccessDenied) {
            Logger.warn(`Error writing node ${
              contentFile.nodeId.toString()
            }: Make sure it is not opened in atvise builder`);

            handleErrors(err, StatusCodes.Good, done => done());
          } else if (statusCode === StatusCodes.BadNodeIdUnknown) {
            if (this.createNodes) {
              Logger.debug(`Node ${
                contentFile.nodeId.toString()
                }: does not exist and is pushed to create node stream`);

              this.push(combinedNodeFile);
            } else {
              Logger.info(`Node ${
                contentFile.nodeId.toString()
                }: does not exist in atvise server address space`);
            }

            handleErrors(err, StatusCodes.Good, done => done());
          } else {
            this.emit("write-successful", contentFile);
            handleErrors(err, StatusCodes.Good, done => done());
          }
        });
      } catch (e) {
        handleErrors(e);
      }
    }
  };
}
