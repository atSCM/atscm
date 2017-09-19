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
    return `Error processing file:  ${combinedNodeFile.contentFile.nodeId.toString()}`;
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {Object} The resulting call script object.
   */
  getCreateNodeCallObject(combinedNodeFile) {
    let paramObj = this.createParamObj(combinedNodeFile);

    return {
      objectId: CallScriptMethodBaseNodeId.toString(),
      methodId: CallScriptMethodId.toString(),
      inputArguments: [
        {dataType: DataType.NodeId, value: CreateNodeScriptId},
        {dataType: DataType.NodeId, value: CreateNodeScriptBaseNodeId},
        {
          dataType: DataType.String,
          arrayType: VariantArrayType.Array,
          value: ["configObjString"]
        },
        {
          dataType: DataType.Variant,
          arrayType: VariantArrayType.Array,
          value: [paramObj]
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
    let contentFile = {};
    let typeDefinitionFile = combinedNodeFile.typeDefinitionFile;
    let nodeId = typeDefinitionFile.nodeId;
    let typeDefinitionConfig = JSON.parse(typeDefinitionFile.value);
    let typeDefinition = typeDefinitionConfig.references[ReverseReferenceTypeIds[ReferenceTypeIds.HasTypeDefinition]][0];
    let modellingRule = typeDefinitionConfig.references[ReverseReferenceTypeIds[ReferenceTypeIds.HasTypeDefinition]][0];

    let paramObj = {
      nodeId: nodeId.toString(),
      parentNodeId: nodeId.parentNodeId.toString(),
      nodeClass: NodeClass[typeDefinition.nodeClass].value,
      typeDefinition: new NodeId(typeDefinition.refNodeId).value,
      modellingRule: new NodeId(modellingRule.refNodeId).value,
    };

    if (!combinedNodeFile.isTypeDefOnlyFile) {
      contentFile = combinedNodeFile.contentFile;
      paramObj.dataType = contentFile.dataType.value;
      paramObj.value = contentFile.value;
    }

    return new Variant({
      dataType: DataType.String,
      value: JSON.stringify(paramObj)
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

    this.session.call([callObj], function (err, results) {
      console.log(results);
    });


    handleErrors(null, StatusCodes.Good, done => done());

  }
}

