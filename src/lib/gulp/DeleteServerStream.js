import readline from 'readline';
import Logger from 'gulplog';
import {join, dirname} from 'path';
import {createReadStream} from 'fs';
import ProjectConfig from '../../config/ProjectConfig';
import DeleteNodeStream from '../delete/DeleteNodeStream';
import NodeId from '../ua/NodeId';

/**
 * A stream that deletes listed nodes from atvise server
 */
export default class DeleteFsStream {

  /**
   * Creates a new DeleteServerStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {String} [options.deleteFileName] The delete file name.
   */
  constructor(options = {}) {

    /**
     * The delete file name
     * @type {String}
     */
    const deleteFileName = options.deleteFileName || 'deleteServer.txt';

    const lineReader = readline.createInterface({
      input: createReadStream(deleteFileName)
    });

    const deleteNodeStream = new DeleteNodeStream();

    const printProgress = setInterval(() => {
      Logger.info(`Deleted: ${deleteNodeStream.processed} (${deleteNodeStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    lineReader.on('line', line => {
      const nodeId = line.indexOf('nodeId=') > -1 ? new NodeId(line.split('nodeId=')[1].trim()) :
        new NodeId(line.trim());

      deleteNodeStream.write(nodeId);
    });


    deleteNodeStream.on('drained', () => {
      deleteNodeStream._flush(() => {
        clearInterval(printProgress);
        deleteNodeStream.emit('finish');
      });
    });

    return deleteNodeStream;
  }
}
