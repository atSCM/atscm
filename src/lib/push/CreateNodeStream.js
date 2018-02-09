import Logger from 'gulplog';
import {
  ReferenceTypeIds,
  StatusCodes,
  DataType,
  NodeClass,
  Variant,
} from 'node-opcua';
import CallScriptStream from '../script/CallScriptStream';
import NodeId from '../ua/NodeId';
import ReverseReferenceTypeIds from '../ua/ReverseReferenceTypeIds';


/**
 * Type definition key for type definition files
 * @type {String}
 */
const TypeDefinitionKey = ReverseReferenceTypeIds[ReferenceTypeIds.HasTypeDefinition];

/**
 * Modelling rule key for type definition files
 * @type {String}
 */
const ModellingRuleKey = ReverseReferenceTypeIds[ReferenceTypeIds.HasModellingRule];


/**
 * Definition for the parameter name of the CreateNode script
 * @type {Array}
 */
const CreateNodeScriptParameterName = 'paramObjString';


/**
 * A stream that creates atvise server nodes for the given{@link CombinedNodeFiles}s
 */
export default class CreateNodeStream extends CallScriptStream {

  /**
   * Creates a new CreateNodeStream.
   */
  constructor() {
    super(new NodeId('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode'));
  }


  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error creating node:  ${combinedNodeFile.typeDefinitionFile.nodeId.toString()}`;
  }


  /**
   * Creates the parameter object for creating nodes.
   * @param {CombinedNodeFile} combinedNodeFile The combined node file to process
   * the error message for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(combinedNodeFile) {
    const typeDefinitionFile = combinedNodeFile.typeDefinitionFile;
    const nodeId = typeDefinitionFile.nodeId;
    const typeDefinitionConfig = JSON.parse(typeDefinitionFile.value);
    const paramObjString = new Variant({ dataType: DataType.String, value: '' });
    let typeDefinition = {};
    let modellingRuleRefs;

    if (typeDefinitionFile.isBaseTypeDefinition) {
      typeDefinition = typeDefinitionConfig;
    } else {
      typeDefinition = typeDefinitionConfig[TypeDefinitionKey].items[0];
      modellingRuleRefs = typeDefinitionConfig[ModellingRuleKey];
    }

    const configObj = {
      nodeId: nodeId.value,
      parentNodeId: nodeId.parentNodeId.value,
      browseName: nodeId.browseName,
      nodeClass: NodeClass[typeDefinition.nodeClass].value,
      typeDefinition: new NodeId(typeDefinition.refNodeId).value,
      modellingRule: modellingRuleRefs ? new NodeId(modellingRuleRefs.items[0].refNodeId).value :
        null,
    };

    if (!combinedNodeFile.isTypeDefOnlyFile) {
      const contentFile = combinedNodeFile.contentFile;
      const dataType = contentFile.dataType.value;

      configObj.dataType = dataType;
      configObj.valueRank = contentFile.arrayType.value;
      configObj.value = contentFile.createNodeValue;
    }

    paramObjString.value = JSON.stringify(configObj);

    return { paramNames: [CreateNodeScriptParameterName], paramValues: [paramObjString] };
  }

  /**
   * Handles the call script methods callback.
   * @param {Array} results The result of the call.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, combinedNodeFile, handleErrors) {
    const outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value !== StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      const createdNode = outputArguments[3].value[0].value;
      const creatingNodeFailed = outputArguments[3].value[1].value;

      if (creatingNodeFailed) {
        Logger.error(`Node ${
          combinedNodeFile.typeDefinitionFile.nodeId.toString()
        }: Creating node failed`);
      } else if (createdNode) {
        Logger.info(`Created node:  ${
          combinedNodeFile.typeDefinitionFile.nodeId.toString()
        }`);
      }
      handleErrors(null, StatusCodes.Good, done => done());
    }
  }

}
