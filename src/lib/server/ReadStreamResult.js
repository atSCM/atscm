import { VariantArrayType, DataType } from 'node-opcua';
import NodeConfigStreamResult from './NodeConfigStreamResult';
import checkType from '../../util/validation';
import AtviseFile from './AtviseFile';

/**
 * Custom Atvise File Type for node configurations for later handling in type definition
 * {NodeStream.ReadResult}.
 */
const NodeConfigResourceType = AtviseFile.getAtviseTypesByValue()['Custom.NodeConfig'];

/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

export default class ReadStreamResult {

  /**
   * Creates a new Read stream result object based on the given {@link NodeConfigStreamResult} and
   * other options.
   * @param {BrowseStream.BrowseResult} browseStreamResult The browseStreamResult to process
   * @param {node-opcua~DataValue} readValue The read value for variable nodes
   */
  constructor(nodeConfigStreamResult, readValue = {}) {
    if (!checkType(nodeConfigStreamResult, NodeConfigStreamResult)) {
      throw new Error('Class ReadStreamResult: Can not parse given arguments!');
    }

    /**
     * Configuration object for mapping data to the filesystem
     * @type {Object}
     */
    this.mappingItem = this.createMappingItem(nodeConfigStreamResult, readValue);
  }


  /**
   * Creates a new Read stream result object based on the given {@link NodeConfigStreamResult} and
   * other options.
   * @param {BrowseStreamResult} browseStreamResult The browseStreamResult to process
   * @param {node-opcua~DataValue} readValue The read value for variable nodes
   */
  createMappingItem(nodeConfigStreamResult, readResult = {}) {
    let readValue = {};
    const mappingItem = {
      nodeId: nodeConfigStreamResult.sourceNodeId,
    };

    if (nodeConfigStreamResult.isNodeConfig) {
      mappingItem.value = JSON.stringify(nodeConfigStreamResult.nodeConfig);
      mappingItem.dataType = DataType.String;
      mappingItem.arrayType = VariantArrayType.Scalar;
      mappingItem.dataType = DataType.String;
      mappingItem.typeDefinition = NodeConfigResourceType.typeDefinition;
    } else if (readResult) {
      readValue = readResult.value;
      mappingItem.value = readValue.value;
      mappingItem.dataType = readValue.$dataType;
      mappingItem.arrayType = readValue.$arrayType;
      mappingItem.typeDefinition = nodeConfigStreamResult.processItem.typeDefinition;
      mappingItem.mtime = readResult.sourceTimestamp;
    }

    return mappingItem;
  }
}
