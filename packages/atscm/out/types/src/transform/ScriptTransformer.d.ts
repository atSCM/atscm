/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export class AtviseScriptTransformer extends XMLTransformer {
    /**
     * The source file extension to allow for scripts.
     */
    static get scriptSourceExtension(): string;
    constructor(options?: any);
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
}
/**
 * A transformer that splits atvise server scripts into multiple files.
 */
export class ServerscriptTransformer extends AtviseScriptTransformer {
    constructor(options?: any);
}
/**
 * A transformer that splits atvise quickdynamics into multiple files.
 */
export class QuickDynamicTransformer extends AtviseScriptTransformer {
    constructor(options?: any);
}
import XMLTransformer from "../lib/transform/XMLTransformer";
