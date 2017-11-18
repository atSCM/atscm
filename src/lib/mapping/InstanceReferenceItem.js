import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from '../ua/NodeId';
import MappingItem from './MappingItem';
import { browse_service as BrowseService, ReferenceTypeIds, DataType, VariantArrayType } from 'node-opcua';
import ReverseReferenceTypeIds from '../ua/ReverseReferenceTypeIds';

/**
 * Mapping item for node type definitions and other reference types
 * @abstract
 */

export default class InstanceReferenceItem extends MappingItem {

  /**
   * Creates a new InstanceReferenceItem
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   */
  constructor(nodeId, references, itemTypeDefinition) {
    if (!checkType(nodeId, NodeId) || !checkType(references, BrowseService.ReferenceDescription) ||
      !checkType(itemTypeDefinition, NodeId)) {
      throw new Error('InstanceReferenceItem#constructor: Can not parse given arguments!');
    }

    super(nodeId);

    /**
     * Mapping item configuration source
     * @type {node-opcua~ReferenceDescription[]}
     */
    this.source = references;

    /**
     * The item type definition
     * @type {node-opcua~NodeId}
     */
    this.itemTypeDefinition = itemTypeDefinition;

    const configObj = {};

    references.map(ref => this.addRefToConfig(ref, configObj));
    this.config = this.createConfigItem(configObj);
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get shouldBeRead() {
    return false;
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @return {*} The configuration for the given reference
   */
  createRefConfig(ref) {
    throw new Error('InstanceReferenceItem#createRefConfigObj must be implemented by all subclasses');
  }


  /**
   * Adds the given {node-opcua~ReferenceDescription} to the config object.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @param {Object} refConfig The reference object to add the given reference
   */
  addRefToConfig(ref, refConfig) {
    const referenceName = ReverseReferenceTypeIds[ref.referenceTypeId.value];

    if (refConfig.hasOwnProperty(referenceName)) {
      refConfig[referenceName].items.push(this.createRefConfig(ref));
    } else {
      refConfig[referenceName] = {
        referenceIdValue: ReferenceTypeIds[referenceName],
        items: [this.createRefConfig(ref)],
      };
    }
  }


  /**
   * Creates a node configuration object for type definitions and atvise reference types
   * @param {Object} config The object that contains the reference configuration
   */
  createConfigItem(config) {
    return {
      nodeId: this.nodeId,
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      dataType: DataType.String,
      value: JSON.stringify(config),
      typeDefinition: this.itemTypeDefinition,
    };
  }
}
