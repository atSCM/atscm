import { browse_service as BrowseService, DataType, VariantArrayType } from 'node-opcua';
import checkType from '../../util/validation';
import NodeId from '../ua/NodeId';
import MappingItem from './MappingItem';


/**
 * Custom Atvise File Type for base type definitions
 * @type {node-opcua~NodeId}
 */
const BaseTypeDefinitionResourceId = new NodeId('Custom.BaseTypeDefinition');


/**
 * Mapping item object for variable nodes
 */

export default class BaseTypeDefinitionItem extends MappingItem {

  /**
   * Creates a new ReadNodeItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription} reference The {@link node-opcua~ReferenceDescription}
   * to create the read node mapping item for.
   */
  constructor(nodeId, reference) {
    if (!checkType(nodeId, NodeId) || !checkType(reference, BrowseService.ReferenceDescription)) {
      throw new Error('BaseTypeDefinitionItem#constructor: Can not parse given arguments!');
    }

    super(reference.nodeId);

    /**
     * configItem source
     * @type {node-opcua~ReferenceDescription}
     */
    this.source = reference;

    this.config = {
      nodeId: reference.nodeId,
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: JSON.stringify(this.createRefConfigObj(reference)),
      typeDefinition: BaseTypeDefinitionResourceId,
    };
  }

  /**
   * `true` for read node mapping items.
   * @type {boolean}
   */
  get shouldBeRead() {
    return false;
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process.
   * @return {Object} The configuration object for the given reference
   */
  createRefConfigObj(ref) {
    return {
      nodeClass: ref.$nodeClass.key,
      refNodeId: ref.typeDefinition.toString(),
    };
  }

}
