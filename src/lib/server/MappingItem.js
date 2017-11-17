import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from './NodeId';
import { ReferenceTypeIds, DataType, VariantArrayType, NodeClass, browse_service as BrowseService } from 'node-opcua';

/**
 * Custom Atvise File Type for type definitions
 */
const TypeDefinitionResourceId = new NodeId('Custom.TypeDefinition');

/**
 * Custom Atvise File Type for references
 */
const ReferenceTypeResourceId = new NodeId('Custom.AtvReferences');


/**
 * Internal type name for atvise reference configuration items
 */
const AtvReferenceConfigName = 'atvReferenceConfig';

/**
 * Internal type name for type definition configuration items
 */
const TypeDefConfigName = 'typeDefConfig';

/**
 * Internal type name for read node configuration items
 */
const ReadNodeConfigName = 'readNodeConfig';


/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

export default class MappingItem {

  /**
   * Creates a new NodeStream based on the nodes to start browsing with and some options.
   * @param {Boolean} isNodeConfig If the created object is a node configuration or not
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription[] or node-opcua~ReferenceDescription[]} referenceConfig An array of {@link node-opcua~ReferenceDescription}s
   * to ignore.
   */
  constructor(browseNodeId, referenceConfig) {
    if (!checkType(browseNodeId, NodeId) || !checkType(referenceConfig, BrowseService.ReferenceDescription)) {
      throw new Error('Class MappingItem: Can not parse given arguments!');
    }

    /**
     * The browsed node id
     * @type {node-opcua~NodeId}
     */
    this.browseNodeId = browseNodeId;

    /**
     * The nodeId the reference is pointing at
     * @type {node-opcua~NodeId}
     */
    this.refNodeId = referenceConfig.nodeId;

    /**
     * References description for non node config items
     * @type {node-opcua~ReferenceDescription}
     */
    this.readNodeConfig = {};

    /**
     * Type definition object.
     * @type {Object}
     */
    this.typeDefinitionConfig = {};

    /**
     * Atvise reference configuration.
     * @type {Object}
     */
    this.atvReferenceConfig = {};


    /**
     * Defines if the objects holds a node configuration or not.
     * @type {String}
     */
    this.itemType = '';

    if (referenceConfig instanceof Array) {
      const atvReferences = referenceConfig.map(ref => this.createRefInfo(ref, this.browseNodeId));

      this.itemType = AtvReferenceConfigName;
      this.atvReferenceConfig = this.createNodeConfigItem(atvReferences, ReferenceTypeResourceId);
    } else if (MappingItem.isTypeDefinitionRef(referenceConfig)) {
      const typeDefConfig = this.createRefInfo(referenceConfig, this.browseNodeId);

      this.itemType = TypeDefConfigName;
      this.typeDefinitionConfig = this.createNodeConfigItem(typeDefConfig, TypeDefinitionResourceId,
          MappingItem.isObjectTypeDefinition(referenceConfig));
    } else if (MappingItem.isVarTypeNodeRef(referenceConfig)) {
      this.itemType = ReadNodeConfigName;
      this.readNodeConfig.nodeId = referenceConfig.nodeId;
      this.readNodeConfig.typeDefinition = referenceConfig.typeDefinition;
    } else {
      throw new Error('Class MappingItem: Given reference description has wrong type!');
    }
  }

  /**
   * Checks if the given reference is a type definition
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference is a type definition reference(=true) or not(=false)
   */
  static isTypeDefinitionRef(ref) {
    const referenceType = ref.referenceTypeId.value;

    return referenceType == ReferenceTypeIds.HasTypeDefinition ||
      referenceType == ReferenceTypeIds.HasSubtype;
  }

  /**
   * Checks if the given reference is a object type definition
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference is a object type definition(=true) or not(=false)
   */
  static isObjectTypeDefinition(ref) {
    return ref.referenceTypeId.value == ReferenceTypeIds.HasSubtype;
  }

  /**
   * Checks if the given reference belongs to a variable node
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference belongs to a variable node(=true) or not(=false)
   */
  static isVarTypeNodeRef(ref) {
    return ref.$nodeClass == NodeClass.Variable;
  }

  /**
   * `true` for type definition mapping items.
   * @type {Boolean}
   */
  get isTypeDefinitionConfig() {
    return this.itemType === TypeDefConfigName;
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get isReadNodeConfig() {
    return this.itemType === ReadNodeConfigName;
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get isAtvReferenceConfig() {
    return this.itemType === AtvReferenceConfigName;
  }

  /**
   * The item to process
   * @type {*}
   */
  get itemToProcess() {
    switch (this.itemType) {
      case AtvReferenceConfigName:
        return this.atvReferenceConfig;
        break;
      case TypeDefConfigName:
        return this.typeDefinitionConfig;
        break;
      case ReadNodeConfigName:
        return this.readNodeConfig;
        break;
    }
  }

  /**
   * Returns type info for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to process
   * @param {node-opcua~ReferenceDescription} browseNodeId The source node id
   * @return {String} The JSON string containing the type definition.
   */
  createRefInfo(referenceDescription, browseNodeId) {
    let nodeId = referenceDescription.nodeId,
      referenceType = referenceDescription.referenceTypeId,
      typeDefinition = referenceDescription.typeDefinition;

    return {
      sourceNodeId: browseNodeId,
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

  /**
   * Adds the given data value to the read node config object
   * options.
   * @param {node-opcua~DataValue} dataValue The data value object that is added to the read node config
   */
  addDataValueToReadNodeConfig(dataValue) {
    const variant = dataValue.value;

    if (variant == null) {
      return false;
    }

    this.readNodeConfig.value = variant.value;
    this.readNodeConfig.dataType = variant.$dataType;
    this.readNodeConfig.arrayType = variant.$arrayType;
    this.readNodeConfig.mtime = dataValue.sourceTimestamp;

    return true;
  }

  /**
   * Creates a node configuration object for type definitions and atvise reference types
   * @param {*} value The object that contains node configuration
   * @param {node-opcua~NodeId} typeDefinition The type definition for the node config item
   * @param {Boolean} isObjectTypeDefinition If the given type definition config belongs to an object type or not
   */
  createNodeConfigItem(value, typeDefinition, isObjectTypeDefinition = false) {
    return {
      nodeId: isObjectTypeDefinition ? this.refNodeId : this.browseNodeId,
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      dataType: DataType.String,
      value: JSON.stringify(value),
      typeDefinition,
    };
  }
}
