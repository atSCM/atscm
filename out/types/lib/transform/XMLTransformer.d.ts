/**
 * A transformer used to transform XML documents.
 */
export default class XMLTransformer extends SplittingTransformer {
    /**
     * Creates a new XMLTransformer based on some options.
     * @param {Object} options The options to use.
     */
    constructor(options: any);
    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {function(object: Object): string}
     */
    _fromDBBuilder: (arg0: object, arg1: Object) => string;
    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {function(object: Object): string}
     */
    _fromFilesystemBuilder: (arg0: object, arg1: Object) => string;
    /**
     * Returns the XML builder to use based on the current {@link Transformer#direction}.
     * @type {function(object: Object): string}
     */
    get builder(): (arg0: any, arg1: any) => string;
    /**
     * Parses XML in a node's contents.
     * @param {Node} node The node to process.
     */
    decodeContents(node: any): import("modify-xml").Document;
    /**
     * Builds an XML string from an object.
     * @param {Object} object The object to encode.
     */
    encodeContents(object: any): any;
}
import SplittingTransformer from "./SplittingTransformer";
