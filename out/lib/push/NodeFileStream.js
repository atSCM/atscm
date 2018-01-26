'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _CombinedNodeFile = require('./CombinedNodeFile');

var _CombinedNodeFile2 = _interopRequireDefault(_CombinedNodeFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that combines content {@link AtviseFile}s with type definition {@link AtviseFile}s
 * to {@link CombinedNodeFile}s.
 */
class NodeFileStream extends _QueueStream2.default {

  /**
   * Creates a new NodeFileStream.
   */
  constructor(options = {}) {
    super();

    /**
     * Defines wether the stream works with {CombinedNodeFiles} or {AtviseFile}s.
     * @type {Boolean}
     */
    this.createNodes = options.createNodes || false;

    /**
     * The file cache
     * @type {Map<node-opcua~NodeId, CombinedNodeFile>}
     */
    this.combinedFilesCache = {};
  }

  /**
   * Returns an error message specifically for the given atvise file
   * @param {AtviseFile} file The file to get
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `Error processing file with node id: ${file.nodeId.toString()}`;
  }

  /**
   * Mapps the given content {@link AtviseFiles}s with the given type
   * definition{@link AtviseFiles}s.
   * @param {AtviseFile} file The file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(file, handleErrors) {
    const nodeId = file.nodeId;
    let combinedFile = {};

    if (!_CombinedNodeFile2.default.hasValidType(file)) {
      handleErrors(new Error(`NodeFileStream: File has invalid type:  ${nodeId.toString()}`));
    }

    if (this.combinedFilesCache[nodeId]) {
      combinedFile = this.combinedFilesCache[nodeId];

      if (!combinedFile.addFile(file)) {
        handleErrors(new Error(`NodeFileStream: Duplicate file:  ${nodeId.toString()}`));
      }
    } else {
      this.combinedFilesCache[nodeId] = new _CombinedNodeFile2.default(file, this.createNodes);
      combinedFile = this.combinedFilesCache[nodeId];
    }

    if (combinedFile.isComplete) {
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => {
        this.push(combinedFile);
        delete this.combinedFilesCache[nodeId];
        done();
      });
    } else {
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
    }
  }
}
exports.default = NodeFileStream;
//# sourceMappingURL=NodeFileStream.js.map