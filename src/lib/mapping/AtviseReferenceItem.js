import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from '../ua/NodeId';
import {browse_service as BrowseService} from 'node-opcua';
import InstanceReferenceItem from './InstanceReferenceItem';


/**
 * Custom Atvise File Type for node configurations
 * @type {node-opcua~NodeId}
 */
const AtviseReferenceConfigResourceId = new NodeId("Custom.AtvReferenceConfig");


/**
 * Mapping item object for atvise reference configurations
 */

export default class AtviseReferenceItem extends InstanceReferenceItem {

  /**
   * Creates a new InstanceAtviseReferenceItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription[]} references An array of {@link node-opcua~ReferenceDescription}s
   * to create the atvise reference config item for
   */
  constructor(nodeId, references) {
    if (!checkType(nodeId, NodeId) || !checkType(references, BrowseService.ReferenceDescription)) {
      throw new Error("AtviseReferenceMappingItem#constructor: Can not parse given arguments!");
    }

    super(nodeId, references, AtviseReferenceConfigResourceId);

  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @return {String} The configuration object for the given reference
   */
  createRefConfig(ref) {
    return ref.nodeId.toString()
  }
}