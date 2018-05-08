'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _nodeOpcua = require('node-opcua');

var _TreeStream = require('./TreeStream');

var _TreeStream2 = _interopRequireDefault(_TreeStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 * The underlying {@link TreeStream} ensures the nodes are processed in an order that respects the
 * parent-child relations between nodes. Nodes are created (if needed) before their children are
 * processed.
 */
class WriteStream extends _TreeStream2.default {

  /**
   * Creates a new write stream with the given {@link CreateNodeStream} and
   * {@link AddReferencesStream}. Implementer have to ensure this create stream is actually piped.
   * @param {CreateNodeStream} createStream The stream that handles node creations.
   * @param {AddReferencesStream} addReferencesStream The stream that adds missing node references.
   * @param {Object} options The options passed to the underlying {@link TreeStream}.
   */
  constructor(createStream, addReferencesStream, options) {
    super(options);

    /**
     * If a node has to be created first, it's callback is added to this map.
     * @type {Map<String, function(err: Error)}
     */
    this._createCallbacks = {};

    createStream.on('processed-chunk', ({ nodeId }) => {
      const key = nodeId.toString();

      if (this._createCallbacks[key]) {
        this._createCallbacks[key](null);
      }
    });

    /**
     * The stream responsible for adding additional references.
     * @type {AddReferencesStream}
     */
    this._addReferencesStream = addReferencesStream;
  }

  /**
   * The error message to use when writing a file fails.
   * @param {AtviseFile} file The file being processed.
   * @return {string} The error message to use.
   */
  processErrorMessage(file) {
    return `Error writing ${file.nodeId.value}`;
  }

  /**
   * Pushes a node to the piped create stream and waits for the node to be created.
   * @param {AtviseFile} file The file create the node for.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  _createNode(file, handleErrors) {
    this._createCallbacks[file.nodeId.toString()] = err => {
      handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
    };

    this.push(file);
  }

  /**
   * Writes an {@link AtviseFile} to it's corresponding node on atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    if (file.nodeClass.value !== _nodeOpcua.NodeClass.Variable.value) {
      // Non-variable nodes are just pushed
      this._createNode(file, handleErrors);
      return;
    }

    try {
      this.session.writeSingleNode(file.nodeId.toString(), {
        dataType: file.dataType,
        arrayType: file.arrayType,
        value: file.value
      }, (err, statusCode) => {
        if (statusCode === _nodeOpcua.StatusCodes.BadUserAccessDenied || statusCode === _nodeOpcua.StatusCodes.BadNotWritable) {
          _gulplog2.default.warn(`Error writing node ${file.nodeId.value}
- Make sure it is not opened in atvise builder
- Make sure the corresponding datasource is connected`);
          handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
        } else if (statusCode === _nodeOpcua.StatusCodes.BadNodeIdUnknown) {
          _gulplog2.default.debug(`Node ${file.nodeId.value} does not exist: Attempting to create it...`);

          this._createNode(file, handleErrors);
        } else {
          handleErrors(err, statusCode, done => {
            // Push to add references stream
            this._addReferencesStream.push(file);

            done();
          });
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

  /**
   * Waits for pending operations to complete.
   * @param {Function} callback Called once all queued chunks have been processed.
   */
  _flush(callback) {
    if (this.hasPending) {
      this.on('drained', () => {
        if (Object.keys(this._waitingForParent).length === 0) {
          super._flush(callback);
        }
      });
    } else {
      super._flush(callback);
    }
  }

}
exports.default = WriteStream; /* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */
//# sourceMappingURL=WriteStream.js.map