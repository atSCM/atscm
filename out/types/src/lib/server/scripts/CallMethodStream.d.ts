/**
 * A stream that calls an OPC-UA method for all input files.
 * @abstract
 */
export default class CallMethodStream extends QueueStream {
    constructor(options?: {
        maxParallel?: number;
    });
    /**
     * **Must be implemented in all subclasses:** The {@link NodeId} of the method to call.
     * @type {NodeId} The method's id.
     */
    get methodId(): any;
    /**
     * The {@link NodeId} of the object from which the method should get called. Defaults to the value
     * of {@link NodeId#parent} of {@link CallMethodStream#methodId}.
     * @type {NodeId} The call-object's id.
     */
    get methodBaseId(): any;
    /**
     * The input arguments the method should be called with for a file. Needs to be overridden by
     * subclasses in most cases. Returning `null` indicates no method call is needed.
     * @param {vinyl~File} file The file beeing processed.
     * @return {?node-opcua~Variant[]} The resulting input arguments.
     */
    inputArguments(file: any): any;
    /**
     * Creates a call method request object for a file.
     * @param {vinyl~File} file The file beeing processed.
     * @return {?node-opcua~CallMethodRequest} The resulting call request.
     */
    callRequest(file: any): any;
    /**
     * **Must be implemented by all subclasses:** If the method call returns a status code of
     * *{@link node-opcua~StatusCodes}.Good*, this method decides if the output matches the expected
     * results.
     * @param {vinyl~File} file The file beeing processed.
     * @param {node-opcua~Variant[]} outputArgs The output arguments.
     * @param {function(err: Error)} callback Call this method with an error to indicate the method
     * call didn't work as expected.
     */
    handleOutputArguments(file: any, outputArgs: any, callback: (arg0: any, arg1: Error) => any): void;
}
import QueueStream from "../QueueStream";
