import { ReferenceTypeIds } from 'node-opcua';
import Logger from 'gulplog';
import BrowseStreamResult from './BrowseStreamResult';
import checkType from '../../util/validation';

/**
 * Type definition key for node config object
 */
const TypeDefinitionKey = 'HasTypeDefinition';

/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

export default class NodeConfigStreamResult {

  /**
   * Creates a new NodeConfigStream Result based on the given {BrowseStream.BrowseResult}.
   * @param {BrowseStream.BrowseResult} browseStreamResult The browseStreamResult to process
   */
  constructor(browseStreamResult) {
    if (!checkType(browseStreamResult, BrowseStreamResult)) {
      throw new Error('Class NodeConfigStreamResult: Can not parse given arguments!');
    }

    /**
     * Node configuration object.
     * @type {Object}
     */
    this.nodeConfig = {};

    /**
     * The browsed node id
     * @type {node-opcua~NodeId}
     */
    this.browseNodeId = browseStreamResult.browseNodeId;

    /**
     * Defines if the objects holds a node configuration or not.
     * @type {Boolean}
     */
    this.isNodeConfig = browseStreamResult.isNodeConfig;

    /**
     * References descriptions that belong to the node configuration
     * @type {node-opcua~ReferenceDescription[]}
     */
    this.references = browseStreamResult.references;

    if (this.isNodeConfig) {
      this.nodeConfig.atvReferences = [];
      this.nodeConfig.nodeId = browseStreamResult.browseNodeId;
      browseStreamResult.references.map(ref => this.addRefToConfig(this.nodeConfig, ref));
    }
  }

  /**
   * Checks if the given reference is a type definition
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference is a type definition reference(=true) or not(=false)
   */
  static isTypeDefinitionRef(ref) {
    return ref.referenceTypeId.value === ReferenceTypeIds.HasTypeDefinition;
  }

  /**
   * Source node id
   * @type {node-opcua~NodeId}
   */
  get sourceNodeId() {
    return this.isNodeConfig ? this.browseNodeId : this.references[0].nodeId;
  }

  /**
   * Returns processing item, depending on if the object is a node config item or not
   * @type {node-opcua~NodeId}
   */
  get processItem() {
    return this.isNodeConfig ? this.nodeConfig : this.references[0];
  }

  /**
   * Adds the given {node-opcua~ReferenceDescription} description to the nodeConfig object
   * @param{Object} nodeConfig The configuration object
   * @param{node-opcua~ReferenceDescription} ref The reference description to add
   * @return {Boolean} reference is a type definition reference(=true) or not(=false)
   */
  addRefToConfig(nodeConfig, ref) {
    const refInfo = this.createRefInfo(ref);

    NodeConfigStreamResult.isTypeDefinitionRef(ref) ? nodeConfig[TypeDefinitionKey] = refInfo :
      nodeConfig.atvReferences.push(refInfo);
  }

  /**
   * Returns type info for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to process
   * @return {String} The JSON string containing the type definition.
   */
  createRefInfo(referenceDescription) {
    let nodeId = referenceDescription.nodeId,
      referenceType = referenceDescription.referenceTypeId,
      typeDefinition = referenceDescription.typeDefinition;

    return {
      nodeClass: referenceDescription.nodeClass.key,
      nodeId: {
        identifierType: nodeId.identifierType.key,
        namespaceIndex: nodeId.namespace,
        value: nodeId.value,
      },
      referenceType: {
        identifierType: referenceType.identifierType.key,
        value: referenceType.value,
      },
      typeDefinition: {
        identifierType: typeDefinition.identifierType.key,
        value: typeDefinition.value,
      },
    };
  }
}
