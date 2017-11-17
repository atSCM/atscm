import NodeConfigStreamResult from './NodeConfigStreamResult';
import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from './NodeId';
import { StatusCodes, NodeClass, browse_service as BrowseService } from 'node-opcua';

/**
 * An object that contains the result of a browsed node.
 */
export default class BrowseStreamResult {
  /**
   * Creates a new NodeStream based on the nodes to start browsing with and some options.
   * @param {Boolean} isNodeConfig If the created object is a node configuration or not
   * @param {node-opcua~NodeId} browseNodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription[]} references An array of {@link node-opcua~ReferenceDescription}s
   * to ignore.
   */
  constructor(isNodeConfig, browseNodeId, references) {
    if (!checkType(isNodeConfig, Boolean) || !checkType(browseNodeId, NodeId) || !checkType(references, BrowseService.ReferenceDescription)) {
      throw new Error('Class BrowseStreamResult: Can not parse given arguments!');
    }

    /**
     * Defines if the objects holds a node configuration or not.
     * @type {Boolean}
     */
    this.isNodeConfig = isNodeConfig;

    /**
     * The browsed node id
     * @type {node-opcua~NodeId}
     */
    this.browseNodeId = browseNodeId;

    /**
     * References descriptions that belong to the node configuration
     * @type {node-opcua~ReferenceDescription[]}
     */
    this.references = references;
  }
}
