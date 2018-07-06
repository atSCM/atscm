'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _variant = require('node-opcua/lib/datamodel/variant');

var _opcua_status_code = require('node-opcua/lib/datamodel/opcua_status_code');

var _opcua_node_ids = require('node-opcua/lib/opcua_node_ids');

var _NodeId = require('../model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _Atviseproject = require('../config/Atviseproject');

var _Atviseproject2 = _interopRequireDefault(_Atviseproject);

var _CallScriptStream = require('./scripts/CallScriptStream');

var _CallScriptStream2 = _interopRequireDefault(_CallScriptStream);

var _WaitingStream = require('./WaitingStream');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const serverNodes = new Set(_Atviseproject2.default.ServerRelatedNodes.map(id => id.value));

/**
 * A stream that adds non-standard references to nodes when pushed.
 */
class AddReferencesStream extends (0, _WaitingStream.waitForDependencies)(_CallScriptStream2.default) {

  /**
   * Creates a new stream for adding references to pushed nodes.
   * @param {Object} options The options to pass to the {@link CallScriptStream}.
   */
  constructor(options) {
    super(options);

    /**
     * A stack of {@link NodeId#value}s to be retried afterwards.
     * @type {Set<string>}
     */
    this._retry = new Set();
  }

  /**
   * Returns the references that need to be set for a file.
   * @param {AtviseFile} file The file to check.
   * @return {Object} The files's references.
   */
  referencesToAdd(file) {
    const additionalReferences = Object.assign({}, file.references);
    delete additionalReferences.toParent;
    delete additionalReferences.HasTypeDefinition;
    delete additionalReferences.HasModellingRule;

    return additionalReferences;
  }

  /**
   * Returns the referenced nodes that should be processed before the given file.
   * @param {AtviseFile} file The file to check.
   * @return {NodeId[]} The files dependencies.
   */
  dependenciesFor(file) {
    const refs = this.referencesToAdd(file);

    return Object.values(refs).reduce((deps, nodes) => deps.concat(nodes), []).filter(({ value }) => !serverNodes.has(value));
  }

  /**
   * Id of the *CreateNode* script added with `atscm import`.
   * @type {NodeId}
   */
  get scriptId() {
    return new _NodeId2.default(_NodeId2.default.NodeIdType.STRING, 'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences', 1);
  }

  /**
   * The options required to add references to the node for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The options passed to the *AddReferences* script.
   */
  scriptParameters(file) {
    const additionalReferences = this.referencesToAdd(file);

    const additionalKeys = Object.keys(additionalReferences);

    if (additionalKeys.length > 0) {
      return {
        paramObjString: {
          dataType: _variant.DataType.String,
          value: JSON.stringify({
            nodeId: file.nodeId,
            references: additionalKeys.map(type => ({
              referenceIdValue: _opcua_node_ids.ReferenceTypeIds[type],
              items: additionalReferences[type].map(i => i.toJSON())
            }))
          })
        }
      };
    }

    // No need to add references
    return null;
  }

  /**
   * Prints an error message telling that adding one or more references failed.
   * @param {AtviseFile} file The file who's node could not be created.
   * @return {string} The resulting error message.
   */
  processErrorMessage(file) {
    return `Error adding references to node ${file.nodeId.value}`;
  }

  /**
   * Handles the results of a script call.
   * @param {AtviseFile} file The file the script was called with.
   * @param {node-opcua~Variant[]} outArgs The raw method results.
   * @param {function(err: Error)} callback Called once finished.
   */
  handleOutputArguments(file, outArgs, callback) {
    if (outArgs[0].value !== _opcua_status_code.StatusCodes.Good) {
      callback(new Error(outArgs[1].value));
    } else {
      const [{ value: failures }] = outArgs[3].value;

      if (failures && failures.length) {
        const retryKey = file.nodeId.value;

        if (this._retry.has(retryKey)) {
          this._retry.delete(retryKey);
          callback(new Error(`Failed to create references to ${failures.join(', ')}`));
        } else {
          this._retry.add(retryKey);
          callback(null);

          this.once('drained', () => {
            this.write(file);
          });
        }

        return;
      }

      callback(null);
    }
  }

}
exports.default = AddReferencesStream;
//# sourceMappingURL=AddReferencesStream.js.map