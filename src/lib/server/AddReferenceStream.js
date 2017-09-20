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
const AddReferenceScriptId = new NodeId("ns=1;s=SYSTEM.LIBRARY.PROJECT.SERVERSCRIPTS.atscm.AddReference");

/**
 * Base node id for create node script
 * @type {node-opcua~NodeId}
 */
const AddReferenceScriptBaseNodeId = AddReferenceScriptId.parentNodeId;


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
export default class AddReferenceStream extends QueueStream {

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error adding references:  ${combinedNodeFile.contentFile.nodeId.toString()}`;
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to create the call
   * object for
   * @return {Object} The resulting call script object.
   */
  createCallObject(referenceConfigFile) {
    let paramObj = this.createParamObj(referenceConfigFile);

    return {
      objectId: CallScriptMethodBaseNodeId.toString(),
      methodId: CallScriptMethodId.toString(),
      inputArguments: [
        {dataType: DataType.NodeId, value: AddReferenceScriptId},
        {dataType: DataType.NodeId, value: AddReferenceScriptBaseNodeId},
        {
          dataType: DataType.String,
          arrayType: VariantArrayType.Array,
          value: ["paramObjString"]
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
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to create the call
   * parameter object for.
   * @return {Object} The resulting call script object.
   */
  createParamObj(referenceConfigFile) {
    return new Variant({
      dataType: DataType.String,
      value: referenceConfigFile.value
    });
  }


  /**
   * Creates nodes for the given {@link CombinedNodeFile}'s
   * @param {AtviseFile} referenceConfigFile The reference config file to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(referenceConfigFile, handleErrors) {
    let nodeId = referenceConfigFile.nodeId;
    let callObj = this.createCallObject(referenceConfigFile);

    this.session.call([callObj], (err, results) => {
      if (err) {
        handleErrors(err);
      } else {
        let outputArguments = results[0].outputArguments;

        if (outputArguments[0].value.value != StatusCodes.Good.value) {
          Logger.error(`Adding references for ${nodeId} failed. \n Message: ${
            outputArguments[1].value}`);
        } else {
          let failedAttempts = outputArguments[3].value[0].value
          if (failedAttempts.length > 0) {
            failedAttempts.map(targetNodeId => {
              Logger.warn(`Adding reference from ${nodeId} to ${targetNodeId} failed`);
            })
          } else {
            Logger.debug(`Successfully created references for ${nodeId}`);
          }
        }
        handleErrors(err, StatusCodes.Good, done => done());
      }
    });
  }
}

