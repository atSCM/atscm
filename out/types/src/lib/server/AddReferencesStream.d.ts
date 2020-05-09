/**
 * A stream that adds non-standard references to nodes when pushed.
 */
export default class AddReferencesStream {
    /**
     * Creates a new stream for adding references to pushed nodes.
     * @param {Object} options The options to pass to the {@link CallScriptStream}.
     */
    constructor(options: any);
    /**
     * A stack of {@link NodeId#value}s to be retried afterwards.
     * @type {Set<string>}
     */
    _retry: Set<string>;
    /**
     * Returns the references that need to be set for a file.
     * @param {AtviseFile} file The file to check.
     * @return {Object} The files's references.
     */
    referencesToAdd(file: any): any;
    /**
     * Returns the referenced nodes that should be processed before the given file.
     * @param {AtviseFile} file The file to check.
     * @return {NodeId[]} The files dependencies.
     */
    dependenciesFor(file: any): NodeId[];
    /**
     * Id of the *CreateNode* script added with `atscm import`.
     * @type {NodeId}
     */
    get scriptId(): NodeId;
    /**
     * The options required to add references to the node for the given file.
     * @param {AtviseFile} file The processed file.
     * @return {Object} The options passed to the *AddReferences* script.
     */
    scriptParameters(file: any): any;
    /**
     * Prints an error message telling that adding one or more references failed.
     * @param {AtviseFile} file The file who's node could not be created.
     * @return {string} The resulting error message.
     */
    processErrorMessage(file: any): string;
    /**
     * Handles the results of a script call.
     * @param {AtviseFile} file The file the script was called with.
     * @param {node-opcua~Variant[]} outArgs The raw method results.
     * @param {function(err: Error)} callback Called once finished.
     */
    handleOutputArguments(file: any, outArgs: any, callback: (arg0: any, arg1: Error) => any): void;
}
import NodeId from "../model/opcua/NodeId";
