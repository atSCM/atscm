import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua';
import QueueStream from './QueueStream';

/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 */
export default class WriteStream extends QueueStream {

  /**
   * The error message to use when writing a file fails.
   * @param {AtviseFile} file The file being processed.
   * @return {String} The error message to use.
   */
  processErrorMessage(file) {
    return `Error writing ${file.nodeId.toString()}`;
  }

  /**
   * Writes an {@link AtviseFile} to it's corresponding node on atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    console.log('test');

    return;


    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value,
      }, (err, statusCode) => {
        if (statusCode === StatusCodes.BadUserAccessDenied) {
          Logger.warn(`Error writing node ${
            file.nodeId.toString()
          }: Make sure it is not opened in atvise builder`);
          handleErrors(err, StatusCodes.Good, done => done());
        } else {
          handleErrors(err, statusCode, done => {
            this.push(file);
            done();
          });
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
