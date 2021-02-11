import XMLTransformer from '../lib/transform/XMLTransformer';
import { BrowsedNode } from '../lib/server/NodeBrowser';
/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
export default class DisplayTransformer extends XMLTransformer {
    /**
     * The extension to add to display container node names when they are pulled.
     * @type {string}
     */
    static get extension(): string;
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
     * Returns `true` for all display nodes.
     * @param {Node} node The node to check.
     */
    shouldBeTransformed(node: any): any;
    /**
     * Splits any read files containing atvise displays into their SVG and JavaScript sources,
     * alongside with a json file containing the display's parameters.
     * @param node The node to split.
     * @param context The transform context.
     */
    transformFromDB(node: BrowsedNode, context: {
        remove: () => void;
        addNode: (add: BrowsedNode) => void;
    }): Promise<void>;
    /**
     * Creates a display from the collected nodes.
     * @param {BrowsedNode} node The container node.
     * @param {Map<string, BrowsedNode>} sources The collected files, stored against their
     * extension.
     */
    combineNodes(node: any, sources: any): any;
}
