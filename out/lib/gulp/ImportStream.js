'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _nodeOpcua = require('node-opcua');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _QueueStream = require('../server/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _NodeId = require('../server/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Call script node id
 * @type {NodeId}
 */
const methodId = new _NodeId2.default('ns=1;s=AGENT.OPCUA.METHODS.importNodes');

/**
 * Base node id for callscript node
 * @type {NodeId}
 */
const methodBaseId = methodId.parent;

/**
 * The import operation's scope, which is set to be *absolute*.
 * @type {NodeId}
 */
const scopeId = new _NodeId2.default(_NodeId2.default.NodeIdType.NUMERIC, 0, 0);

/**
 * The call object that is used for all calls.
 * @type {Object}
 */
const baseCallObject = {
  objectId: methodBaseId.toString(),
  methodId: methodId.toString(),
  inputArguments: [{
    dataType: _nodeOpcua.DataType.NodeId,
    value: scopeId
  }]
};

/**
 * A stream that imports xml files in parallel.
 */
class ImportStream extends _QueueStream2.default {

  /**
   * @param {vinyl~file} file The file to create the call object for.
   * Creates the call object for the given file.
   * @return {Object} The resulting call script object.
   */
  createCallObject(file) {
    return Object.assign({}, baseCallObject, {
      inputArguments: baseCallObject.inputArguments.concat({
        dataType: _nodeOpcua.DataType.XmlElement,
        value: file.contents
      })
    });
  }

  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~file} file The file to generate the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(file) {
    return `Error importing file: ${(0, _path.relative)(process.cwd(), file.path)}`;
  }

  /**
   * Performs opcua method calls for the given call object configuration.
   * @param {vinyl~file} file The file being processed.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    const callObj = this.createCallObject(file);

    try {
      this.session.call([callObj], (err, [result] = []) => {
        if (err) {
          handleErrors(err);
        } else if (result.statusCode.value !== _nodeOpcua.StatusCodes.Good.value) {
          handleErrors(err, result.statusCode, done => done());
        } else {
          const importSuccessFull = result.outputArguments[0].value;

          if (importSuccessFull) {
            _gulplog2.default.debug(`Successfully imported file: ${file.path}`);

            handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
          } else {
            handleErrors(new Error('No success'), _nodeOpcua.StatusCodes.Good, done => done());
          }
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
exports.default = ImportStream;
//# sourceMappingURL=ImportStream.js.map