import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { DataType } from 'node-opcua/lib/datamodel/variant';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import Logger from 'gulplog';
import NodeId from '../model/opcua/NodeId';
import { ReferenceTypeIds, ReferenceTypeNames } from '../model/Node';
import CallScriptStream from './scripts/CallScriptStream';

/**
 * A stream that creates OPC-UA nodes for the passed {@link AtviseFiles}s.
 */
export default class CreateNodeStream extends CallScriptStream {

  /**
   * Id of the *CreateNode* script added with `atscm import`.
   * @type {NodeId}
   */
  get scriptId() {
    return new NodeId(NodeId.NodeIdType.STRING,
      'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode',
      1
    );
  }

  /**
   * The options required to create a node for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The options passed to the *CreateNode* script.
   */
  scriptParameters(file) {
    const options = {
      nodeId: file.nodeId,
      parentNodeId: file.parent ? file.parent.nodeId : 'Objects',
      nodeClass: file.nodeClass.value,
      typeDefinition: file.typeDefinition,
      browseName: file.idName,
    };

    const toParentRefs = file.references.get(ReferenceTypeIds.toParent);
    if (toParentRefs) {
      options.reference = ReferenceTypeNames[[...toParentRefs][0]];
    }

    const rules = file.references.get(ReferenceTypeIds.HasModellingRule);
    if (rules) {
      options.modellingRule = [...rules][0];
    }

    if (file.nodeClass.value === NodeClass.Variable.value) {
      options.dataType = file.variantValue.dataType.value;
      options.valueRank = file.variantValue.arrayType.value;
      options.value = file.variantValue.value;
    }

    return {
      paramObjString: {
        dataType: DataType.String,
        value: JSON.stringify(options),
      },
    };
  }

  /**
   * Prints an error message telling that creating a node failed.
   * @param {AtviseFile} file The file who's node could not be created.
   * @return {string} The resulting error message.
  */
  processErrorMessage(file) {
    return `Error creating node ${file.nodeId}`;
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
      const [{ value: createdNode }, { value: createFailed }] = outArgs[3].value;

      if (createFailed) {
        Logger.warn('Failed to create node', file.nodeId.toString());
      } else if (createdNode) {
        Logger.debug('Created node', file.nodeId.toString());
        this.push(file);
      } else {
        Logger.debug('Node', file.nodeId.toString(), 'already exists');
        this.push(file);
      }

      callback(null);
    }
  }

}
