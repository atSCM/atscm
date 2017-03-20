import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua';
import QueueStream from './QueueStream';

export default class WriteStream extends QueueStream {

  processErrorMessage(file) {
    return `Error writing ${file.nodeId.toString()}`;
  }

  processChunk(file, callback) {
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
          callback(err, StatusCodes.Good, done => done());
        } else {
          callback(err, statusCode, done => {
            this.push(file);
            done();
          });
        }
      });
    } catch (e) {
      callback(e);
    }
  }

}
