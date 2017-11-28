'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _nodeOpcua = require('node-opcua');

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that writes all read {@link CombinedNodeFiles}s to their corresponding
 * nodes on atvise server.
 */
class WriteStream extends _QueueStream2.default {

  /**
   * Creates a new WriteStream based on a source file stream.
   * @param {Object} options The stream configuration options.
   */
  constructor(options = {}) {
    super();

    /**
     * Defines wether the stream works with {CombinedNodeFiles} or {AtviseFile}s.
     * @type {Boolean}
     */
    this.createNodes = options.createNodes || false;
  }

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
   * Writes {@link CombinedNodeFile.contentFile}'s values to the corresponding nodes on
   * the atvise server.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(combinedNodeFile, handleErrors) {
    const contentFile = combinedNodeFile.contentFile;

    if (this.createNodes && combinedNodeFile.isTypeDefOnlyFile) {
      this.push(combinedNodeFile);
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
    } else {
      try {
        this.session.writeSingleNode(contentFile.nodeId.toString(), {
          dataType: contentFile.dataType,
          arrayType: contentFile.arrayType,
          value: contentFile.value
        }, (err, statusCode) => {
          if (statusCode.value === _nodeOpcua.StatusCodes.BadUserAccessDenied.value) {
            _gulplog2.default.warn(`Error writing node ${contentFile.nodeId.toString()}: Make sure it is not opened in atvise builder`);

            handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
          } else if (statusCode === _nodeOpcua.StatusCodes.BadNodeIdUnknown) {
            if (this.createNodes) {
              _gulplog2.default.debug(`Node ${contentFile.nodeId.toString()}: does not exist and is pushed to create node stream`);

              this.push(combinedNodeFile);
            } else {
              _gulplog2.default.info(`Node ${contentFile.nodeId.toString()}: does not exist in atvise server address space`);
            }

            handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
          } else {
            this.emit('write-successful', contentFile);
            handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
          }
        });
      } catch (e) {
        handleErrors(e);
      }
    }
  }
}
exports.default = WriteStream;
//# sourceMappingURL=WriteStream.js.map