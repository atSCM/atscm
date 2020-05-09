/**
 * A stream that creates OPC-UA nodes for the passed {@link AtviseFiles}s.
 */
export default class CreateNodeStream extends CallScriptStream {
    constructor(options?: {
        maxParallel?: number;
    });
    /**
     * Handles the results of a script call.
     * @param {AtviseFile} file The file the script was called with.
     * @param {node-opcua~Variant[]} outArgs The raw method results.
     * @param {function(err: Error)} callback Called once finished.
     */
    handleOutputArguments(file: any, outArgs: any, callback: (arg0: any, arg1: Error) => any): void;
}
import CallScriptStream from "./scripts/CallScriptStream";
