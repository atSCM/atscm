import { DataType, VariantArrayType } from 'node-opcua';
import NodeId from '../../model/opcua/NodeId';
import CallMethodStream from './CallMethodStream';

/**
 * A stream that calls atvise server scripts for all passed nodes.
 * @abstract
 */
export default class CallScriptStream extends CallMethodStream {

  /**
   * The id of the *callScript* method.
   * @type {NodeId}
   */
  get methodId() {
    return new NodeId(NodeId.NodeIdType.STRING, 'AGENT.SCRIPT.METHODS.callScript', 1);
  }

  /**
   * **Must be implemented by all subclasses:** The id of the script to call.
   * @type {NodeId}
   * @abstract
   */
  get scriptId() {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Id of the script's base object.
   * @type {NodeId}
   */
  get scriptBaseId() {
    return this.scriptId.parent;
  }

  /**
   * Returns the parameters to call the script with for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The parameters passed to the script.
   */
  scriptParameters(file) { // eslint-disable-line no-unused-vars
    return {};
  }

  /**
   * Creates the raw method input arguments for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {node-opcua~Variant[]} Input arguments for the *callScript* method.
   */
  inputArguments(file) {
    const params = this.scriptParameters(file);
    const paramNames = Object.keys(params);

    return [
      {
        dataType: DataType.NodeId,
        value: this.scriptId,
      },
      {
        dataType: DataType.NodeId,
        value: this.scriptBaseId,
      },
      {
        dataType: DataType.String,
        arrayType: VariantArrayType.Array,
        value: paramNames,
      },
      {
        dataType: DataType.Variant,
        arrayType: VariantArrayType.Array,
        value: paramNames.map(key => params[key]),
      },
    ];
  }

  /**
   * Returns the error message logged if running the script fails.
   * @param {AtviseFile} file The processed file.
   * @return {string} The resulting error message.
   */
  processErrorMessage(file) {
    return `Error running script ${this.scriptId} for ${file.relative}`;
  }

}
