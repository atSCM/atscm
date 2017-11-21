import Logger from 'gulplog';
import checkType from '../../util/validation';
import NodeId from './NodeId';
import {ReferenceTypeIds, DataType, VariantArrayType, NodeClass, browse_service as BrowseService} from 'node-opcua';
import ReverseReferenceTypeIds from './ReverseReferenceTypeIds';

/**
 * Custom Atvise File Type for type definitions
 * @type {node-opcua~NodeId}
 */
const TypeDefinitionConfigResourceId = new NodeId("Custom.TypeDefinition");

/**
 * Custom Atvise File Type for node configurations
 * @type {node-opcua~NodeId}
 */
const AtviseReferenceConfigResourceId = new NodeId("Custom.AtvReferenceConfig");

/**
 * Type name for type definition configuration items
 * @type {String}
 */
const TypeDefinitionConfigName = 'typeDefConfig';

/**
 * Type name for read node configuration items
 * @type {String}
 */
const ReadNodeConfigName = 'readNodeConfig';

/**
 * Type name for read node configuration items
 * @type {String}
 */
const AtviseReferenceConfigName = 'atvRefConfig';

/**
 * Map to translate type node classes to the corresponding instance node classes
 * @type {Map<node-opcua~NodeClass, node-opcua~NodeClass>}
 */
const InstanceNodeClasses = {
  [NodeClass.ObjectType]: NodeClass.Object,
  [NodeClass.VariableType]: NodeClass.Variable
};

/**
 * Base node id for all object type definitions
 * @type {NodeId}
 */
const ObjectTypesId = new NodeId("ObjectTypes");

/**
 * Base node id for all variable type definitions
 * @type {NodeId}
 */
const VariableTypesId = new NodeId("VariableTypes");


/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

export default class MappingItem {

  /**
   * Creates a new NodeStream based on the nodes to start browsing with and some options.
   * @param {Boolean} isNodeConfig If the created object is a node configuration or not
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {String} itemType The mapping item type
   * @param {node-opcua~ReferenceDescription or node-opcua~ReferenceDescription[]} referenceConfig An array of {@link node-opcua~ReferenceDescription}s
   * to ignore.
   */
  constructor(sourceNodeId, referenceConfig, itemType) {
    if (!checkType(sourceNodeId, NodeId) || !checkType(referenceConfig, BrowseService.ReferenceDescription) ||
        !checkType(itemType, String)) {
      throw new Error("MappingItem#constructor: Can not parse given arguments!");
    } else if (!MappingItem.hasValidItemType(itemType)) {
      throw new Error("MappingItem#constructor: Item type is not valid!");
    }

    /**
     * The browsed node id
     * @type {node-opcua~NodeId}
     */
    this.sourceNodeId = sourceNodeId;

    /**
     * References description for non node config items
     * @type {node-opcua~ReferenceDescription}
     */
    this.readNodeConfig = {};

    /**
     * Type definition configuration object.
     * @type {Object}
     */
    this.typeDefinitionConfig = {};

    /**
     * Type definition configuration object.
     * @type {Object}
     */
    this.atviseReferenceConfig = {};

    /**
     * Defines the mapping item type
     * @type {String}
     */
    this.itemType = itemType;

    if (referenceConfig instanceof Array) {
      let configObj = {sourceNodeId: this.sourceNodeId.toString(), references:{}};
      referenceConfig.map(ref => this.addRefToNodeConfig(ref, configObj.references));

      this.itemType == AtviseReferenceConfigName ? this.atviseReferenceConfig = this.createNodeConfigItem(configObj, AtviseReferenceConfigResourceId) :
        this.typeDefinitionConfig = this.createNodeConfigItem(configObj, TypeDefinitionConfigResourceId);

    } else if (MappingItem.isVarTypeNodeRef(referenceConfig)) {
      this.itemType = ReadNodeConfigName;
      this.readNodeConfig.nodeId = referenceConfig.nodeId;
      this.readNodeConfig.typeDefinition =  referenceConfig.typeDefinition;

    } else {
      throw new Error("Class MappingItem: Given reference config has wrong type!");
    }
  }

  /**
   * Checks if the given reference is a object type definition
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference is a object type definition(=true) or not(=false)
   */
  static isObjectOrVarTypeDefinitionRef(ref) {
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
   * Checks if the given item type is valid
   * @param{String} itemType The item type to check
   * @return {Bool} item type is valid(=true) or not(=false)
   */
  static hasValidItemType(itemType) {
    return [ReadNodeConfigName, AtviseReferenceConfigName, TypeDefinitionConfigName].indexOf(itemType) > -1;
  }

  /**
   * `true` for node configuration items.
   * @type {Boolean}
   */
  get isNodeConfig() {
    return this.itemType === NodeConfigName;
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get isReadNodeConfig() {
    return this.itemType === ReadNodeConfigName;
  }

  /**
   * The item to process
   * @type {*}
   */
  get itemToProcess() {
    switch(this.itemType) {
      case AtviseReferenceConfigName:
        return this.atviseReferenceConfig;
        break;
      case TypeDefinitionConfigName:
        return this.typeDefinitionConfig;
        break;
      case ReadNodeConfigName:
        return this.readNodeConfig;
        break;
    }
  }

  /**
   * Returns type info for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @param {Object} referenceConfig The reference object to fill
   * @return {String} The JSON string containing the type definition.
   */
  addRefToNodeConfig(ref, refConfig) {
    let referenceName = "";
    let isObjOrVarTypeRef = MappingItem.isObjectOrVarTypeDefinitionRef(ref);

    if (isObjOrVarTypeRef) {
      referenceName = ReverseReferenceTypeIds[ReferenceTypeIds.HasTypeDefinition];
      // set subtype reference id for source node id
      this.sourceNodeId = ref.nodeId;

    } else {
      referenceName = ReverseReferenceTypeIds[ref.referenceTypeId.value];
    }

    if (refConfig.hasOwnProperty(referenceName)) {
      refConfig[referenceName].items.push(this.createRefConfigObj(ref, isObjOrVarTypeRef));
    } else {
      refConfig[referenceName] = {
        referenceIdValue: ReferenceTypeIds[referenceName],
        items: [this.createRefConfigObj(ref, isObjOrVarTypeRef)]
      };
    }
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @param {Boolean} isObjOrVarTypeRef If the mapping item belongs to a base type or not
   * @return {Object} The configuration object for the given reference
   */
  createRefConfigObj(ref, isObjOrVarTypeRef) {
    let refNodeId = ref.nodeId;

    return {
      refNodeId: refNodeId.toString(),
      nodeClass: isObjOrVarTypeRef ? ref.$nodeClass.key : InstanceNodeClasses[ref.$nodeClass],
      typeDefinition: ref.typeDefinition.toString()
    }
  }

  /**
   * Adds the given data value to the read node config object
   * options.
   * @param {node-opcua~DataValue} dataValue The data value object that is added to the read node config
   */
  addDataValueToReadNodeConfig (dataValue) {
    let variant = dataValue.value;

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
   * @param {Object} config The object that contains node configuration
   * @param {node-opcua~NodeId} typeDefinition The type definition for the node config item
   */
  createNodeConfigItem (config, typeDefinition) {
    return {
      nodeId: this.sourceNodeId,
      dataType : DataType.String,
      arrayType : VariantArrayType.Scalar,
      dataType : DataType.String,
      value : JSON.stringify(config),
      typeDefinition : typeDefinition
    }
  }
}