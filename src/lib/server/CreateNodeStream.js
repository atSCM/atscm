import Logger from 'gulplog';
import { ReferenceTypeIds, StatusCodes, DataType, NodeClass, VariantArrayType, Variant} from 'node-opcua';
import QueueStream from './QueueStream';
import NodeId from './NodeId';
import ReverseReferenceTypeIds from './ReverseReferenceTypeIds';

/**
 * Call script node id
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodId = new NodeId("ns=1;s=AGENT.SCRIPT.METHODS.callScript");

/**
 * Base node id for callscript node
 * @type {node-opcua~NodeId}
 */
const CallScriptMethodBaseNodeId = CallScriptMethodId.parentNodeId;

/**
 * Create node script id
 * @type {node-opcua~NodeId}
 */
const CreateNodeScriptId = new NodeId("ns=1;s=SYSTEM.LIBRARY.PROJECT.SERVERSCRIPTS.atscm.CreateNode");

/**
 * Base node id for create node script
 * @type {node-opcua~NodeId}
 */
const CreateNodeScriptBaseNodeId = CreateNodeScriptId.parentNodeId;


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
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 */
export default class WriteStream extends QueueStream {

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error creating node:  ${combinedNodeFile.contentFile.nodeId.toString()}`;
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {Object} The resulting call script object.
   */
  getCreateNodeCallObject(combinedNodeFile) {
    let configObj = this.createParamObj(combinedNodeFile);

    return {
      objectId: CallScriptMethodBaseNodeId.toString(),
      methodId: CallScriptMethodId.toString(),
      inputArguments: [
        {dataType: DataType.NodeId, value: CreateNodeScriptId},
        {dataType: DataType.NodeId, value: CreateNodeScriptBaseNodeId},
        {
          dataType: DataType.String,
          arrayType: VariantArrayType.Array,
          value: ["configString"]
        },
        {
          dataType: DataType.Variant,
          arrayType: VariantArrayType.Array,
          value: [configObj]
        }
      ]
    };
  }

  /**
   * Creates the parameter object for creating nodes
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {Object} The resulting call script object.
   */
  createParamObj(combinedNodeFile) {
    let typeDefinitionFile = combinedNodeFile.typeDefinitionFile;
    let nodeId = typeDefinitionFile.nodeId;
    let typeDefinitionConfig = JSON.parse(typeDefinitionFile.value);
    let typeDefinition = typeDefinitionConfig.references[TypeDefinitionKey][0];
    let modellingRuleRefs = typeDefinitionConfig.references[ModellingRuleKey];

    let configObj = {
      nodeId: nodeId.toString(),
      parentNodeId: nodeId.parentNodeId.toString(),
      nodeClass: NodeClass[typeDefinition.nodeClass].value,
      typeDefinition: new NodeId(typeDefinition.refNodeId).value,
      modellingRule: modellingRuleRefs ? new NodeId(modellingRuleRefs[0].refNodeId).value : null
    };

    if (!combinedNodeFile.isTypeDefOnlyFile) {
      let contentFile = combinedNodeFile.contentFile;
      configObj.dataType = contentFile.dataType.value;
      configObj.value = contentFile.value;
      configObj.valueRank = contentFile.arrayType.value;
    }

    return new Variant({
      dataType: DataType.String,
      value: JSON.stringify(configObj)
    });
  }


  /**
   * Creates nodes for the given {@link CombinedNodeFile}'s
   * @param {CombinedNodeFile} file The combined file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(combinedNodeFile, handleErrors) {
    let callObj = this.getCreateNodeCallObject(combinedNodeFile);

    this.session.call([callObj], (err, results) => {
      if (err) {
        handleErrors(err);
      } else {
        let outputArguments = results[0].outputArguments;

        if (outputArguments[0].value.value != StatusCodes.Good.value) {
         handleErrors(new Error(outputArguments[1].value.value));
        } else {
         if (outputArguments[3].value[0].value != StatusCodes.Good.value) {
           Logger.warn(`Node ${
             combinedNodeFile.typeDefinitionFile.nodeId.toString()
           }: Creating node failed`);
         } else {
           Logger.debug(`Created node:  ${
             combinedNodeFile.typeDefinitionFile.nodeId.toString()
           }`);
           handleErrors(err, StatusCodes.Good, done => done());
         }
        }
      }
    });
  }
}

