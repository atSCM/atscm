/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */

import Logger from 'gulplog';
import { StatusCodes, NodeClass } from 'node-opcua';
import QueueStream from './QueueStream';

/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 */
export default class WriteStream extends QueueStream {

  /**
   * The error message to use when writing a file fails.
   * @param {AtviseFile} file The file being processed.
   * @return {string} The error message to use.
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
    if (file.nodeClass.value !== NodeClass.Variable.value) { // Non-variable nodes are just pushed
      this.push(file);
      handleErrors(null, StatusCodes.Good, done => done());
      return;
    }

    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value,
      }, (err, statusCode) => {
        if (
          (statusCode === StatusCodes.BadUserAccessDenied) ||
          (statusCode === StatusCodes.BadNotWritable)
        ) {
          Logger.warn(`Error writing node ${
            file.nodeId.toString()
          }: Make sure it is not opened in atvise builder`);
          handleErrors(err, StatusCodes.Good, done => done());
        } else if (statusCode === StatusCodes.BadNodeIdUnknown) {
          Logger.debug(`Node ${
            file.nodeId.toString()
          } does not exist: Attempting to create it...`);

          handleErrors(err, StatusCodes.Good, done => {
            this.push(file);
            done();
          });
        } else {
          handleErrors(err, statusCode, done => done());
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
