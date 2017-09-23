import Logger from 'gulplog';
import {ReferenceTypeIds, StatusCodes, DataType, NodeClass, VariantArrayType, Variant} from 'node-opcua';
import CallScriptStream from './CallScriptStream';
import NodeId from './NodeId';
import ReverseReferenceTypeIds from './ReverseReferenceTypeIds';


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
const CreateNodeScriptParameterName = "paramObjString";


/**
 * A stream that creates atvise server nodes for the given{@link CombinedNodeFiles}s
 */
export default class CreateNodeStream extends CallScriptStream {

  /**
   * Creates a new CreateNodeStream
   */
  constructor() {
    super(new NodeId("ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode"));
  }


  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error creating node:  ${combinedNodeFile.typeDefinitionFile.nodeId.toString()}`;
  }


  /**
   * Creates the parameter object for creating nodes
   * @param {CombinedNodeFile} combinedNodeFile The combined node file to process
   * the error message for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(combinedNodeFile) {
    let typeDefinitionFile = combinedNodeFile.typeDefinitionFile;
    let nodeId = typeDefinitionFile.nodeId;
    let typeDefinitionConfig = JSON.parse(typeDefinitionFile.value);
    let typeDefinition = typeDefinitionConfig.references[TypeDefinitionKey].items[0];
    let modellingRuleRefs = typeDefinitionConfig.references[ModellingRuleKey];
    let paramObjString = new Variant({dataType: DataType.String, value: ""})

    let configObj = {
      nodeId: nodeId.value,
      parentNodeId: nodeId.parentNodeId.value,
      browseName: nodeId.browseName,
      nodeClass: NodeClass[typeDefinition.nodeClass].value,
      typeDefinition: new NodeId(typeDefinition.refNodeId).value,
      modellingRule: modellingRuleRefs ? new NodeId(modellingRuleRefs.items[0].refNodeId).value : null,
    };

    if (!combinedNodeFile.isTypeDefOnlyFile) {
      let contentFile = combinedNodeFile.contentFile;
      let dataType = contentFile.dataType.value;

      configObj.dataType = dataType;
      configObj.value = dataType == DataType.ByteString ? contentFile.value.toString('binary') :
        contentFile.value;
      configObj.valueRank = contentFile.arrayType.value;
    }

    paramObjString.value = JSON.stringify(configObj)

    return {paramNames: [CreateNodeScriptParameterName], paramValues: [paramObjString]};
  }


  /**
   * Converts a buffer to a byte array
   * @param {Buffer} buffer The buffer being converted
   * @return {Number[]} The resulting byte array.
   */
  getByteArrayFromBuffer (buffer) {
    let byteArray = []
    for (const value of buffer) {
      byteArray.push(value)
    }
    return byteArray;
  }

  /**
   * Handles the call script methods callback
   * @param {Array} result The result of the call
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, combinedNodeFile, handleErrors) {
    let outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value != StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      let createdNode = outputArguments[3].value[0].value;
      let creatingNodeFailed = outputArguments[3].value[1].value;

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

