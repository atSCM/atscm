import Logger from 'gulplog';
import { StatusCodes, DataType, Variant} from 'node-opcua';
import CallScriptStream from './CallScriptStream';
import NodeId from './NodeId';


/**
 * Definition for the parameter name of the CreateNode script
 * @type {Array}
 */
const AddReferencesScriptParameterName = "paramObjString";


/**
 * A stream that adds node references for the given reference config {AtviseFile}'s on the atvise server.
 */
export default class AddReferenceStream extends CallScriptStream {

  /**
   * Creates a new CreateNodeStream
   */
  constructor() {
    super(new NodeId("ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences"));
  }


  /**
   * Returns an error message specifically for the given combined file.
   * @param {AtviseFile} referenceConfigFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(referenceConfigFile) {
    return `Error adding references:  ${referenceConfigFile.nodeId.toString()}`;
  }


  /**
   * Creates the parameter object for creating nodes
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to create the call
   * parameter object for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(referenceConfigFile) {
    const paramObj = {
      nodeId: referenceConfigFile.nodeId,
      references: JSON.parse(referenceConfigFile.value)
    };

    let paramValue = new Variant({
      dataType: DataType.String,
      value: JSON.stringify(paramObj)
    });

    return {paramNames: [AddReferencesScriptParameterName], paramValues: [paramValue]};
  }


  /**
   * Handles the call script methods callback
   * @param {Array} result The result of the call
   * @param {AtviseFile} referenceConfigFile The referenceConfig file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, referenceConfigFile, handleErrors) {
    const nodeId = referenceConfigFile.nodeId;
    let outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value != StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      let failedAttempts = outputArguments[3].value[0].value;

      if (failedAttempts) {
        if (failedAttempts.length > 0) {
          failedAttempts.map(targetNodeId => {
            Logger.error(`Adding reference from ${nodeId} to ${targetNodeId} failed`);
          });
        } else {
          Logger.debug(`Successfully created references for ${nodeId}`);
        }
      }
      handleErrors(null, StatusCodes.Good, done => done());
    }
  }
}

