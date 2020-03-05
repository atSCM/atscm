/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export class AtviseScriptTransformer extends XMLTransformer {
    constructor(options: any);
    /**
     * Extracts a script's metadata.
     * @param {Object} document The parsed xml document to process.
     * @return {Object} The metadata found.
     */
    processMetadata(document: any): any;
    /**
     * Extracts a script's parameters.
     * @param {Object} document The parsed xml document to process.
     * @return {Object[]} The parameters found.
     */
    processParameters(document: any): any[];
    /**
     * Splits a node into multiple source nodes.
     * @param {Node} node A server node.
     * @param {Object} context The current transform context.
     */
    transformFromDB(node: any, context: any): Promise<any>;
    /**
     * Inlines the passed source nodes to the given container node.
     * @param {Node} node The container node.
     * @param {{ [ext: string]: Node }} sources The source nodes to inline.
     */
    combineNodes(node: any, sources: {
        [ext: string]: any;
    }): void;
}
/**
 * A transformer that splits atvise server scripts into multiple files.
 */
export class ServerscriptTransformer extends AtviseScriptTransformer {
    constructor(options: any);
    /**
     * Returns `true` for all script nodes.
     * @param {Node} node The node to check.
     * @return {boolean} If the node is a server script.
     */
    shouldBeTransformed(node: any): boolean;
}
/**
 * A transformer that splits atvise quickdynamics into multiple files.
 */
export class QuickDynamicTransformer extends AtviseScriptTransformer {
    constructor(options: any);
    /**
     * Returns `true` for all nodes containing quick dynamics.
     * @param {Node} node The node to check.
     * @return {boolean} If the node is a quick dynamic.
     */
    shouldBeTransformed(node: any): boolean;
}
import XMLTransformer from "../lib/transform/XMLTransformer";
