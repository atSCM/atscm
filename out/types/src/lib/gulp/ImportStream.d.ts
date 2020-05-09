/**
 * A stream that imports xml files in parallel.
 */
export default class ImportStream extends CallMethodStream {
    constructor(options?: {
        maxParallel?: number;
    });
    /**
     * Id of the `importNodes` OPC-UA method.
     * @type {NodeId}
     */
    get methodId(): NodeId;
}
import CallMethodStream from "../server/scripts/CallMethodStream";
import NodeId from "../model/opcua/NodeId";
