'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _fs = require('fs');

var _DeleteNodeStream = require('../delete/DeleteNodeStream');

var _DeleteNodeStream2 = _interopRequireDefault(_DeleteNodeStream);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that deletes listed nodes from atvise server
 */
class DeleteFsStream {

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

    const lineReader = _readline2.default.createInterface({
      input: (0, _fs.createReadStream)(deleteFileName)
    });

    const deleteNodeStream = new _DeleteNodeStream2.default();

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Deleted: ${deleteNodeStream.processed}`, `(${deleteNodeStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
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
        const nodeId = new _NodeId2.default(nodeString);

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
exports.default = DeleteFsStream;
//# sourceMappingURL=DeleteServerStream.js.map