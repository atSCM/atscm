/**
 * A stream that creates OPC-UA nodes for the passed {@link AtviseFiles}s.
 */
export default class CreateNodeStream extends CallScriptStream {
    constructor(options?: {
        maxParallel?: number;
    });
}
import CallScriptStream from "./scripts/CallScriptStream";
