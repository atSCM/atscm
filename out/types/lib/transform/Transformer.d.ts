/**
 * The directions a transformer can be run in.
 * @type {{FromDB: string, FromFilesystem: string}}
 */
export const TransformDirection: {
    FromDB: string;
    FromFilesystem: string;
};
/**
 * The base transformer class.
 * @abstract
 */
export default class Transformer {
    /**
     * Returns a function that combines multiple transformer actions.
     * @param {Transformer[]} transformers An array of transformers.
     * @param {TransformDirection} direction The direction to use.
     * @return {function(node: Node): Promise<any>} The combined transform function.
     */
    static combinedTransformer(transformers: Transformer[], direction: {
        FromDB: string;
        FromFilesystem: string;
    }): (arg0: any, arg1: any) => Promise<any>;
    /**
     * Creates a new Transformer with the specified options.
     * @param {Object} [options] The options to use.
     * @param {TransformDirection} [options.direction] The direction to use.
     * @throws {Error} Throws an error if the given direction is invalid.
     */
    constructor({ direction }?: {
        direction?: {
            FromDB: string;
            FromFilesystem: string;
        };
    });
    direction: TransformerDirection;
    /**
     * Returns the Transformer with the given direction.
     * @param {TransformDirection} direction The direction to use.
     * @return {Transformer} Itself, to be chainable.
     * @throws {Error} Throws an error if the given direction is invalid.
     */
    withDirection(direction: {
        FromDB: string;
        FromFilesystem: string;
    }): Transformer;
    /**
     * Determines if a node's value node should be read, e.G. The *Variable.Bool* file for a node
     * defined in *.Variable.Bool.Json*.
     * @param {FileNode} node The node to read or not.
     * @return {boolean?} *true* if the node's value file should be read, undefined to let other
     * transformers decide.
     */
    readNodeFile(node: any): boolean;
    /**
     * **Must be overridden by all subclasses:** Transforms the given node when using
     * {@link TransformDirection.FromDB}.
     * @param {BrowsedNode} node The node to split.
     * @param {Object} context The transform context.
     */
    transformFromDB(node: any, context: any): Promise<void>;
    /**
     * **Must be overridden by all subclasses:** Transforms the given node when using
     * {@link TransformDirection.FromFilesystem}.
     * @param {BrowsedNode} node The node to transform.
     * @param {Object} context The browser context.
     */
    transformFromFilesystem(node: any, context: any): Promise<void>;
    /**
     * A transform wrapper that works with both async/await (atscm >= 1) and callback-based
     * (atscm < 1)transformers.
     * @param {TransformDirection} direction The direction to use.
     * @param {Node} node The node to transform.
     * @param {Object} context The browser context.
     */
    compatTransform(direction: {
        FromDB: string;
        FromFilesystem: string;
    }, node: any, context: any): Promise<any>;
}
