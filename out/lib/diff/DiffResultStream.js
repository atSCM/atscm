'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _fs = require('fs');

var _path = require('path');

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream checks if the given {@link NodeId}s exist on the atvise server or on
 * the filesystem, depending on the stream direction
 */
class DiffResultStream extends _QueueStream2.default {

  /**
   * Creates a new DiffItemStream.
   * @param {Object} The options to use.
   * @param {String|Path|Buffer} [options.filePath] The diff files path.
   */
  constructor(options = {}) {
    super();

    const filePath = options.filePath || 'diff.log';

    /**
     * The output write stream to create the logfile
     * @type {Stream}
     */
    this.logger = (0, _fs.createWriteStream)(filePath);
  }

  /**
   * Returns an error message specifically for the given mapping item.
   * @param {DiffFile} file The diff file to create the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `DiffStream#processErrorMessage: Error processing item ${file.toString()}`;
  }

  /**
   * Diffs the given {AtviseFile} with the corresponding atvise server resource or
   * file systsem resource.
   * @param {DiffItem} diffItem The diffItem to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(diffItem, handleErrors) {
    handleErrors(null, _nodeOpcua.StatusCodes.Good, done => {
      this.logger.write(`${diffItem.state.text} ` + `nodeId=${diffItem.nodeId.value}, ` + `nodeFilePath=${(0, _path.dirname)(diffItem.path)}\n`);

      done();
    });
  }
}
exports.default = DiffResultStream;
//# sourceMappingURL=DiffResultStream.js.map