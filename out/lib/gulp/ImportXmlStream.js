'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Call script node id
 * @type {node-opcua~NodeId}
 */
const ImportNodesMethodId = new _NodeId2.default('ns=1;s=AGENT.OPCUA.METHODS.importNodes');

/**
 * Base node id for callscript node
 * @type {node-opcua~NodeId}
 */
const ImportNodesMethodBaseNodeId = ImportNodesMethodId.parentNodeId;

/**
 * A stream that imports xml files in parallel.
 */
class ImportXmlStream extends _QueueStream2.default {

  /**
   * @param {vinyl~file} file The file to create the call object for.
   * Creates the call object for the given file
   * @return {Object} The resulting call script object.
   */
  createCallObject(file) {
    return {
      objectId: ImportNodesMethodBaseNodeId.toString(),
      methodId: ImportNodesMethodId.toString(),
      inputArguments: [{
        dataType: _nodeOpcua.DataType.NodeId,
        value: new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 0, 0) // absolute import
      }, {
        dataType: _nodeOpcua.DataType.XmlElement,
        value: file.contents
      }]
    };
  }

  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~file} file The file to generate the error message for
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `Error importing file: ${file.path}`;
  }

  /**
   * Performs opcua method calls for the given call object configuration
   * @param {vinyl~file} file The file being processed.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    const callObj = this.createCallObject(file);

    try {
      this.session.call([callObj], (err, results) => {
        if (err) {
          handleErrors(err);
        } else if (results[0].statusCode.value !== _nodeOpcua.StatusCodes.Good.value) {
          handleErrors(err, results[0].statusCode, done => done());
        } else {
          const importSuccessFull = results[0].outputArguments[0].value;

          if (importSuccessFull) {
            _gulplog2.default.info(`Successfully imported file: ${file.path}`);
          } else {
            _gulplog2.default.error(this.processErrorMessage(file));
          }

          handleErrors(err, _nodeOpcua.StatusCodes.Good, done => done());
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }
}
exports.default = ImportXmlStream;
//# sourceMappingURL=ImportXmlStream.js.map