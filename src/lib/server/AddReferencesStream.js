import { DataType } from 'node-opcua/lib/datamodel/variant';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import NodeId from '../model/opcua/NodeId';
import { ReferenceTypeIds } from '../model/Node';
import Atviseproject from '../config/Atviseproject';
import CallScriptStream from './scripts/CallScriptStream';
import { waitForDependencies } from './WaitingStream';

const serverNodes = new Set(Atviseproject.ServerRelatedNodes.map(id => id.value));

const ignoredReferences = new Set([
  ReferenceTypeIds.toParent,
  ReferenceTypeIds.HasTypeDefinition,
  ReferenceTypeIds.HasModellingRule,
]);

/**
 * A stream that adds non-standard references to nodes when pushed.
 */
export default class AddReferencesStream extends waitForDependencies(CallScriptStream) {

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

    return Object.values(refs)
      .reduce((deps, nodes) => deps.concat(nodes), [])
      .filter(({ value }) => !serverNodes.has(value));
  }

  /**
   * Id of the *CreateNode* script added with `atscm import`.
   * @type {NodeId}
   */
  get scriptId() {
    return new NodeId(NodeId.NodeIdType.STRING,
      'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences',
      1
    );
  }

  /**
   * The options required to add references to the node for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The options passed to the *AddReferences* script.
   */
  scriptParameters(file) {
    const references = [...file.references]
      .reduce((result, [key, value]) => {
        if (ignoredReferences.has(key)) { return result; }

        return Object.assign(result, {
          [key]: [...value].map(s => (typeof s === 'string' ? `ns=1;s=${s}` : s)),
        });
      }, {});

    const referenceKeys = Object.keys(references);

    if (referenceKeys.length > 0) {
      return {
        paramObjString: {
          dataType: DataType.String,
          value: JSON.stringify({
            nodeId: file.nodeId,
            references: referenceKeys
              .map(type => ({
                referenceIdValue: parseInt(type, 10),
                items: references[type],
              })),
          }),
        },
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
    return `Error adding references to node ${file.nodeId}`;
  }

  /**
   * Handles the results of a script call.
   * @param {AtviseFile} file The file the script was called with.
   * @param {node-opcua~Variant[]} outArgs The raw method results.
   * @param {function(err: Error)} callback Called once finished.
   */
  handleOutputArguments(file, outArgs, callback) {
    if (outArgs[0].value !== StatusCodes.Good) {
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
