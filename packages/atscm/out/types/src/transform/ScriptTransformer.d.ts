import ConfigTransformer from '../lib/transform/ConfigTransformer';
import type { ServerscriptConfig } from '../../types/schemas/serverscript-config';
/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export declare class AtviseScriptTransformer extends ConfigTransformer<ServerscriptConfig> {
    /**
     * The source file extension to allow for scripts.
     */
    static get scriptSourceExtension(): string;
    /**
     * The source file extensions to allow.
     * @type {string[]}
     */
    static get sourceExtensions(): string[];
    /**
     * Extracts a script's metadata.
     * @param {Object} document The parsed xml document to process.
     * @return {Object} The metadata found.
     */
    processMetadata(document: any): ServerscriptConfig;
    /**
     * Extracts a script's parameters.
     * @param {Object} document The parsed xml document to process.
     * @return {Object[]} The parameters found.
     */
    processParameters(document: any): {
        [k: string]: unknown;
        name: string;
        desc?: string;
        substitute?: string;
        valuetype: "string" | "number" | "address" | "display" | "trstring" | "bool" | "color" | "enum" | "global";
        behavior: "mandatory" | "optional" | "hidden";
        defaultvalue?: string;
        config?: string;
        group?: string;
        target?: {
            namespaceIndex: number;
            name: string;
        };
    }[];
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
    combineNodes(node: any, sources: any): void;
}
/**
 * A transformer that splits atvise server scripts into multiple files.
 */
export declare class ServerscriptTransformer extends AtviseScriptTransformer {
    /** The container's extension. */
    static get extension(): string;
    /**
     * Returns `true` for all script nodes.
     * @param {Node} node The node to check.
     * @return {boolean} If the node is a server script.
     */
    shouldBeTransformed(node: any): any;
}
/**
 * A transformer that splits atvise quickdynamics into multiple files.
 */
export declare class QuickDynamicTransformer extends AtviseScriptTransformer {
    /** The container's extension. */
    static get extension(): string;
    /**
     * Returns `true` for all nodes containing quick dynamics.
     * @param {Node} node The node to check.
     * @return {boolean} If the node is a quick dynamic.
     */
    shouldBeTransformed(node: any): any;
}
export declare class DisplayScriptTransformer extends AtviseScriptTransformer {
    /** The container's extension. */
    static get extension(): string;
    /**
     * Returns `true` for all nodes containing quick dynamics.
     * @param {Node} node The node to check.
     * @return {boolean} If the node is a quick dynamic.
     */
    shouldBeTransformed(node: any): any;
}
