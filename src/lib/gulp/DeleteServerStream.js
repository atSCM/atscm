import readline from 'readline';
import { createReadStream } from 'fs';
import Logger from 'gulplog';
import DeleteNodeStream from '../delete/DeleteNodeStream';
import NodeId from '../ua/NodeId';

/**
 * A stream that deletes listed nodes from atvise server
 */
export default class DeleteFsStream {

  /**
   * Creates a new DeleteServerStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {string} [options.deleteFileName] The delete file name.
   */
  constructor(options = {}) {
    /**
     * The delete file name
     * @type {String}
     */
    const deleteFileName = options.deleteFileName || 'deleteServer.txt';

    const lineReader = readline.createInterface({
      input: createReadStream(deleteFileName),
    });

    const deleteNodeStream = new DeleteNodeStream();

    const printProgress = setInterval(() => {
      Logger.info(
        `Deleted: ${deleteNodeStream.processed}`,
        `(${deleteNodeStream.opsPerSecond.toFixed(1)} ops/s)`
      );

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    lineReader.on('line', line => {
      const trimmedLine = line.trim();
      const lineArray = trimmedLine.split('nodeId=');
      let nodeString = '';

      if (lineArray.length > 1) {
        nodeString = lineArray[1];

        if (nodeString.indexOf(', nodeFilePath=') > -1) {
          nodeString = nodeString.split(', nodeFilePath=')[0];
        }
      } else {
        nodeString = trimmedLine;
      }

      if (nodeString) {
        const nodeId = new NodeId(nodeString);

        if (nodeString !== nodeId.filePath) {
          deleteNodeStream.write(nodeId);
        }
      }
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
