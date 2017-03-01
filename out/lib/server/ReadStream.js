'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An object transform stream that reads the written {@link NodeId}s.
 */
class ReadStream extends _Stream2.default {

  /**
   * Reads the given node.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description of the
   * node to read from.
   * @param {function(err: ?Error, data: ?ReadStream.ReadResult)} callback Called with the error
   * that occurred, or the read results the read results otherwise.
   */
  readNode(referenceDescription, callback) {
    const nodeId = referenceDescription.nodeId;

    this.session.read([{ nodeId }], (err, nodesToRead, results) => {
      if (err) {
        callback(new Error(`Reading ${nodeId.toString()} failed: ${err.message}`));
      } else if (!results || results.length === 0) {
        callback(new Error(`Reading ${nodeId.toString()} failed: No results`));
      } else if (results[0].statusCode !== _nodeOpcua.StatusCodes.Good) {
        callback(new Error(`Reading ${nodeId.toString()} failed: Status ${results[0].statusCode}`));
      } else {
        callback(null, {
          nodeId,
          value: results[0].value,
          referenceDescription
        });
      }
    });
  }

  /**
   * Calls {@link ReadStream#readNode} once the session is open for the passed node.
   * @param {NodeId} nodeId The node to read.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?Object)} callback Called by {@link ReadStream#readNode}
   * once reading ended.
   * @listens {Session} Listens to the `session-open`-event if the session is not open yet.
   */
  _transform(nodeId, enc, callback) {
    if (this.session) {
      this.readNode(nodeId, callback);
    } else {
      this.once('session-open', () => this.readNode(nodeId, callback));
    }
  }

}

exports.default = ReadStream; /**
                               * @typedef {Object} ReadStream.ReadResult
                               * @property {NodeId} nodeId The read node's id.
                               * @property {?node-opcua~DataValue} value The read value.
                               * @property {Object} referenceDescription Additional info on the read node.
                               */