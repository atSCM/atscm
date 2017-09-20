import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua';
import QueueStream from './QueueStream';

/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 */
export default class WriteStream extends QueueStream {

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
   * @param {CombinedNodeFile} file The combined file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(combinedNodeFile, handleErrors) {
    const contentFile = combinedNodeFile.contentFile;

    if (combinedNodeFile.isTypeDefOnlyFile) {
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
            Logger.warn(`Node ${
              contentFile.nodeId.toString()
              }: does not exist. Combined node file is pushed to CreateNode stream`);

            this.push(combinedNodeFile);
            handleErrors(err, StatusCodes.Good, done => done());
          } else {
            handleErrors(err, StatusCodes.Good, done => done());
          }
        });
      } catch (e) {
        handleErrors(e);
      }
    }
  };
}
