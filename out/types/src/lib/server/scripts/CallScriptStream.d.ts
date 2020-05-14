/**
 * A stream that calls atvise server scripts for all passed nodes.
 * @abstract
 */
export default class CallScriptStream extends CallMethodStream {
    constructor(options?: {
        maxParallel?: number;
    });
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
}
import CallMethodStream from "./CallMethodStream";
import NodeId from "../../model/opcua/NodeId";
