/**
 * A stream that calls atvise server scripts for all passed nodes.
 * @abstract
 */
export default class CallScriptStream extends CallMethodStream {
    constructor(options?: {
        maxParallel?: number;
    });
    /**
     * The id of the *callScript* method.
     * @type {NodeId}
     */
    get methodId(): NodeId;
    /**
     * **Must be implemented by all subclasses:** The id of the script to call.
     * @type {NodeId}
     * @abstract
     */
    get scriptId(): NodeId;
    /**
     * Id of the script's base object.
     * @type {NodeId}
     */
    get scriptBaseId(): NodeId;
    /**
     * Returns the parameters to call the script with for the given file.
     * @param {AtviseFile} file The processed file.
     * @return {Object} The parameters passed to the script.
     */
    scriptParameters(file: any): any;
    /**
     * Creates the raw method input arguments for the given file.
     * @param {AtviseFile} file The processed file.
     * @return {?node-opcua~Variant[]} Input arguments for the *callScript* method.
     */
    inputArguments(file: any): any;
    /**
     * Returns the error message logged if running the script fails.
     * @param {AtviseFile} file The processed file.
     * @return {string} The resulting error message.
     */
    processErrorMessage(file: any): string;
}
import CallMethodStream from "./CallMethodStream";
import NodeId from "../../model/opcua/NodeId";
