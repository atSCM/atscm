/**
 * A stream that writes all read {@link AtviseFile}s to their corresponding nodes on atvise server.
 * The underlying {@link TreeStream} ensures the nodes are processed in an order that respects the
 * parent-child relations between nodes. Nodes are created (if needed) before their children are
 * processed.
 */
export default class WriteStream extends WaitingStream {
    /**
     * Creates a new write stream with the given {@link CreateNodeStream} and
     * {@link AddReferencesStream}. Implementer have to ensure this create stream is actually piped.
     * @param {CreateNodeStream} createStream The stream that handles node creations.
     * @param {AddReferencesStream} addReferencesStream The stream that adds missing node references.
     * @param {Object} options The options passed to the underlying {@link TreeStream}.
     */
    constructor(createStream: any, addReferencesStream: any, options: any);
    /**
     * If a node has to be created first, it's callback is added to this map.
     * @type {Map<String, function(err: Error)}
     */
    _createCallbacks: Map<string, (arg0: any) => Error>;
    /**
     * The stream responsible for adding additional references.
     * @type {AddReferencesStream}
     */
    _addReferencesStream: any;
    /**
     * The error message to use when writing a file fails.
     * @param {AtviseFile} file The file being processed.
     * @return {string} The error message to use.
     */
    processErrorMessage(file: any): string;
    /**
     * Pushes a node to the piped create stream and waits for the node to be created.
     * @param {AtviseFile} file The file create the node for.
     * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
     * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
     */
    _createNode(file: any, handleErrors: any): void;
    /**
     * Returns a files parent node and type definition.
     * @param {AtviseFile} file The file to check.
     * @return {NodeId[]} The files dependencies.
     */
    dependenciesFor(): any[];
    /**
     * Writes an {@link AtviseFile} to it's corresponding node on atvise server.
     * @param {AtviseFile} file The file to write.
     * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
     * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
     */
    processChunk(file: any, handleErrors: any): void;
}
import WaitingStream from "./WaitingStream";
