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
 * A stream that reads atvise server nodes for the {@link node-opcua~ReferenceDescription}s passed.
 */
class ReadStream extends _QueueStream2.default {

  /**
   * Returns an error message specifically for the given mapping item.
   * @param {MappingItem} mappingItem The reference description to get
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(mappingItem) {
    return `ReadStream#processErrorMessage: Error processing item ${mappingItem.nodeId.toString()}`;
  }

  /**
   * Adds the data of read {node-opcua~DataValue}s for given {@link MappingItem}s.
   * @param {MappingItem} mappingItem The mappingItem to process
   * If the proccessed item is not a type definition, the node value will be read from
   * the atvise server
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */

  processChunk(mappingItem, handleErrors) {
    const nodeId = mappingItem.nodeId;

    // skip reference and type definition files and read node files that already contain a config
    if (!mappingItem.shouldBeRead || mappingItem.dataValueAdded) {
      this.push(mappingItem);
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
    } else {
      this.session.read([{ nodeId }], (err, nodesToRead, results) => {
        if (!err && (!results || results.length === 0)) {
          handleErrors(new Error('No results'));
        } else {
          handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
            const dataValue = results[0];

            if (dataValue.value == null) {
              _gulplog2.default.error(`Unable to read value of node:  ${nodeId.toString()}`);
            } else {
              mappingItem.createConfigItemFromDataValue(dataValue);
              this.push(mappingItem);
            }

            done();
          });
        }
      });
    }
  }
}
exports.default = ReadStream;
//# sourceMappingURL=ReadStream.js.map