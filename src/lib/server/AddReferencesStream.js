import { DataType, StatusCodes, ReferenceTypeIds } from 'node-opcua';
import NodeId from '../model/opcua/NodeId';
import CallScriptStream from './scripts/CallScriptStream';

export default class AddReferencesStream extends CallScriptStream {

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
    const additionalReferences = Object.assign({}, file.references);
    delete additionalReferences.toParent;
    delete additionalReferences.HasTypeDefinition;
    delete additionalReferences.HasModellingRule;

    const additionalKeys = Object.keys(additionalReferences);

    if (additionalKeys.length > 0) {
      return {
        paramObjString: {
          dataType: DataType.String,
          value: JSON.stringify({
            nodeId: file.nodeId,
            references: additionalKeys
              .map(type => ({
                referenceIdValue: ReferenceTypeIds[type],
                items: additionalReferences[type]
                  .map(i => i.toJSON()),
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
    return `Error adding references to node ${file.nodeId.value}`;
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
        callback(new Error(`Failed to create references to ${failures.join(', ')}`));
        return;
      }

      callback(null);
    }
  }

}