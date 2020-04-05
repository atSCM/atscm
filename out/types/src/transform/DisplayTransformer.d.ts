/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
export default class DisplayTransformer extends XMLTransformer {
    constructor(options?: any);
    /**
     * Returns `true` for all display nodes.
     * @param {Node} node The node to check.
     */
    shouldBeTransformed(node: any): any;
    /**
     * Splits any read files containing atvise displays into their SVG and JavaScript sources,
     * alongside with a json file containing the display's parameters.
     * @param {BrowsedNode} node The node to split.
     * @param {Object} context The transform context.
     */
    transformFromDB(node: any, context: any): Promise<void>;
    /**
     * Creates a display from the collected nodes.
     * @param {BrowsedNode} node The container node.
     * @param {Map<string, BrowsedNode>} sources The collected files, stored against their
     * extension.
     */
    combineNodes(node: any, sources: Map<string, any>): any;
}
import XMLTransformer from "../lib/transform/XMLTransformer";
