"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _variant = require("node-opcua/lib/datamodel/variant");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _CallMethodStream = _interopRequireDefault(require("../server/scripts/CallMethodStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The import operation's scope, which is set to be *absolute*.
 * @type {NodeId}
 */
const scopeId = new _NodeId.default(_NodeId.default.NodeIdType.NUMERIC, 0, 0);
/**
 * A stream that imports xml files in parallel.
 */

class ImportStream extends _CallMethodStream.default {
  /**
   * Id of the `importNodes` OPC-UA method.
   * @type {NodeId}
   */
  get methodId() {
    return new _NodeId.default('ns=1;s=AGENT.OPCUA.METHODS.importNodes');
  }
  /**
   * Returns the arguments the `importNodes` needs to be called with for the given file.
   * @param {vinyl~File} file The file being processed.
   * @return {node-opcua~Variant[]} The arguments for the `importNodes` method:
   *  - The import scope (which is set to be absolute)
   *  - The XML code (read from *file*)
   */


  inputArguments(file) {
    return [{
      dataType: _variant.DataType.NodeId,
      value: scopeId
    }, {
      dataType: _variant.DataType.XmlElement,
      value: file.contents
    }];
  }
  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~File} file The file to generate the error message for.
   * @return {string} The specific error message.
   */


  processErrorMessage(file) {
    return `Error importing file: ${file.relative}`;
  }
  /**
   * Checks if the import succeeded and calls `callback` with an error otherwise.
   * @param {vinyl~File} file The file that was processed.
   * @param {?node-opcua~Variant[]} outputArguments The import status output arguments (Array with a
   * single entry).
   * @param {function(err: ?Error)} callback The callback called with an error if import failed.
   */


  handleOutputArguments(file, outputArguments, callback) {
    const [importStatus] = outputArguments || [{}];

    if (importStatus.value) {
      _gulplog.default.debug(`Successfully imported file: ${file.relative}`);

      callback(null);
    } else {
      callback(new Error('Import failed'));
    }
  }

}

exports.default = ImportStream;
//# sourceMappingURL=ImportStream.js.map