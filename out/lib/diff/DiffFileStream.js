'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _DiffFile = require('./DiffFile');

var _DiffFile2 = _interopRequireDefault(_DiffFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream checks if the given {@link NodeId}s exist on the atvise server or
 * on the filesystem, depending on the stream direction
 */
class DiffFileStream extends _QueueStream2.default {

  /**
   * Creates a new DiffStream based on the given stream direction an some options.
   * @param {Object} The options to use.
   * @param {DiffFile.fileType} [options.fileType] The diff file type to create.
   */
  constructor(options = {}) {
    super(options);

    /**
     * The diff file type
     * @type {Map<vinyl~path, DiffItem>}
     */
    const fileType = options.fileType;

    if (!_DiffFile2.default.isValidFileType(fileType)) {
      throw new Error('DiffFileStream#constructor: Invalid file type');
    } else {
      this.itemType = fileType;
    }
  }

  /**
   * Returns an error message specifically for the given mapping item.
   * @param {AtviseFile} file The file to create the error message for
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `DiffFileStream#processErrorMessage: Error processing item ${file.nodeId.toString()}`;
  }

  /**
   * Creates {DiffFiles}'s for the given {AtviseFile}'s
   * @param {DiffFile} file The file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(file, handleErrors) {
    handleErrors(null, _nodeOpcua.StatusCodes.Good, done => {
      this.push(new _DiffFile2.default(file, this.itemType));
      done();
    });
  }
}
exports.default = DiffFileStream;
//# sourceMappingURL=DiffFileStream.js.map