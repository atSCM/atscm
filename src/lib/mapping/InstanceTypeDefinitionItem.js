import { NodeClass, browse_service as BrowseService } from 'node-opcua';
import checkType from '../../util/validation';
import NodeId from '../ua/NodeId';
import InstanceReferenceItem from './InstanceReferenceItem';

/**
 * Custom Atvise File Type for instance type definitions
 * @type {node-opcua~NodeId}
 */
const InstanceTypeDefinitionConfigResourceId = new NodeId('Custom.InstanceTypeDefinition');

/**
 * Map to translate type node classes to the corresponding instance node classes
 * @type {Map<node-opcua~NodeClass, node-opcua~NodeClass>}
 */
const InstanceNodeClasses = {
  [NodeClass.ObjectType]: NodeClass.Object,
  [NodeClass.VariableType]: NodeClass.Variable,
};


/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

export default class InstanceTypeDefinitionItem extends InstanceReferenceItem {

  /**
   * Creates a new InstanceTypeDefinitionItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription} reference The{@link node-opcua~ReferenceDescription}
   * to create the type definition item for.
   */
  constructor(nodeId, references) {
    if (!checkType(nodeId, NodeId) || !checkType(references, BrowseService.ReferenceDescription)) {
      throw new Error('InstanceTypeDefinitionItem#constructor: Can not parse given arguments!');
    }

    super(nodeId, references, InstanceTypeDefinitionConfigResourceId);
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process.
   * @param {NodeId} nodeId browsed nodeId
   * @return {Object} The configuration object for the given reference
   */
  createRefConfig(ref, nodeId) { // eslint-disable-line no-unused-vars
    return {
      refNodeId: ref.nodeId.toString(),
      nodeClass: InstanceNodeClasses[ref.$nodeClass],
    };
  }

}
