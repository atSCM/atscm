import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from '../server/NodeId';
import {browse_service as BrowseService} from 'node-opcua';
import MappingItem from './MappingItem';

/**
 * Mapping item object for variable nodes
 */

export default class ReadNodeItem extends MappingItem {

  /**
   * Creates a new ReadNodeItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription} reference The {@link node-opcua~ReferenceDescription}
   * to create the read node mapping item for.
   */
  constructor(nodeId, reference) {
    if (!checkType(nodeId, NodeId) || !checkType(reference, BrowseService.ReferenceDescription)) {
      throw new Error("MappingItem#constructor: Can not parse given arguments!");
    }

    super(reference.nodeId);

    /**
     * configItem source
     * @type {node-opcua~ReferenceDescription}
     */
    this.source = reference;


    /**
     * 'true' for read node items that already contain a read datavalue info
     * @type {node-opcua~ReferenceDescription}
     */
    this.dataValueAdded = false;
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get shouldBeRead() {
    return true;
  }


  /**
   * Creates the config object from the given {node-opcua~DataValue}
   * options.
   * @param {node-opcua~DataValue} dataValue The data value object that is added to the read node config
   */
  createConfigItemFromDataValue (dataValue) {
    const config = this.config;
    const variant = dataValue.value;
    const source = this.source;

    this.dataValueAdded = true;

    config.nodeId = source.nodeId;
    config.typeDefinition = source.typeDefinition;
    config.value = variant.value;
    config.dataType = variant.$dataType;
    config.arrayType = variant.$arrayType;
    config.mtime = dataValue.sourceTimestamp;
  }
}