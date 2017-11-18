import checkType from '../../util/validation';
import NodeId from '../ua/NodeId';

/**
 * Contains the configuration object for atvise nodes and references tht are mapped on the file
 * system.
 * @abstract
 */
export default class MappingItem {

  /**
   * Creates a new MappingItem
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   */
  constructor(nodeId) {
    if (!checkType(nodeId, NodeId)) {
      throw new Error('MappingItem#constructor: Can not parse given arguments!');
    }

    /**
     * The browsed node id
     * @type {node-opcua~NodeId}
     */
    this.nodeId = nodeId;

    /**
     * Contains mapping item config
     * @type {Object}
     */
    this.config = {};

    /**
     * Contains mapping item config
     * @type {node-opcua~ReferenceDescription or node-opcua~ReferenceDescription[]}
     */
    this.source = undefined;
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get shouldBeRead() {
    throw new Error('MappingItem#shouldBeRead must be implemented by all subclasses');
  }

  /**
   * The mapping item configuration object
   * @type {Object}
   */
  get configObj() {
    if (!this.config) {
      throw new Error('MappingItem#configObj Configuration object is not defined');
    }
    return this.config;
  }

  /**
   * The mapping item configuration source
   * @type {node-opcua~ReferenceDescription or node-opcua~ReferenceDescription[]}
   */
  get configSource() {
    if (!this.source) {
      throw new Error('MappingItem#configSource Configuration source is not defined');
    }
    return this.source;
  }
}
