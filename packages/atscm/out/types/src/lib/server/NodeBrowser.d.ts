/**
 * A node discovered while browsing the server's database.
 */
export class BrowsedNode extends ServerNode {
    /**
     * Creates a new node.
     * @param {Object} options The options to use.
     * @param {?BrowsedNode} options.parent The parent node.
     * @param {Object} options.reference The reference to pick metadata from.
     */
    constructor({ parent, reference, nodeClass, name }: {
        parent: BrowsedNode | null;
        reference: any;
    });
    /** The node's id. @type {NodeId} */
    id: any;
    /** The node's value
     * @type {node-opcua~Variant} */
    value: any;
    /**
     * Add multiple references at once.
     * @param {Object[]} references The references to add.
     */
    addReferences(references: any[]): void;
}
/**
 * Browses the server database.
 */
export default class NodeBrowser {
    /**
     * Creates a new node browser.
     * @param {Object} options The options to use.
     * @param {number} [options.concurrency=250] The maximum of nodes to process in parallel.
     * @param {function(node: BrowsedNode): Promise<any>} options.handleNode A custom node handler.
     * @param {boolean} [options.recursive] If the whole node tree should be processed.
     */
    constructor({ concurrency, ignoreNodes, handleNode, recursive, }?: {
        concurrency: number;
        handleNode: (arg0: any, arg1: BrowsedNode) => Promise<any>;
        recursive: boolean;
    });
    /** The queue used to process nodes in parallel
     * @type {p-queue~PQueue} */
    queue: any;
    /** A map of nodes already handled. Keys are ids, values are `true` if the node was already
     * pushed and `false` otherwise.
     * @type {Map<string, boolean>}
     * */
    _handled: Map<string, boolean>;
    _waitingFor: {};
    /** A regular expression matching all ignored nodes. @type {RegExp} */
    _ignoreNodesRegExp: RegExp;
    /** If the browser should recurse. @type {boolean} */
    _recursive: boolean;
    /** If a warning should be printed for attempting to pull sort order nodes
     * @type {boolean} */
    _printSortOrderWarning: boolean;
    /** The custom node handler. @type {function(node: BrowsedNode): Promise<any>} */
    _handleNode: (arg0: any, arg1: BrowsedNode) => Promise<any>;
    /** The number of pushed (discovered and handled) nodes. @type {number} */
    _pushed: number;
    /** A map that maps node ids against their discovered hierarchical parent nodes. Used to detect
     * reference conflicts.
     * @type {Map<string, string>} */
    parentNode: Map<string, string>;
    ensureHandled: Set<any>;
    /**
     * Reads the given node's value.
     * @param {BrowsedNode} node The node to read.
     */
    _readValue(node: BrowsedNode): Promise<any>;
    /**
     * Browses the server address space at the given node id.
     * @param {Object} options The options to use.
     */
    _browse({ nodeId, browseDirection, resultMask }: any): Promise<any>;
    /**
     * Browses a node.
     * @param {BrowsedNode} node The node to browse.
     */
    _browseNode(node: BrowsedNode): Promise<{
        children: any[];
        references: any[];
    }>;
    /**
     * Finishes processing a given node: After calling {@link NodeBrowser#_handleNode}, it resolves
     * is's dependencies.
     * @param {BrowsedNode} node The node handled.
     */
    _push(node: BrowsedNode): Promise<void>;
    /**
     * Instructs the browser to handle a node that would otherwise be queued behind others (eg: its
     * parent node).
     * @param {BrowsedNode} node The node to add.
     * @return {Promise<?BrowsedNode>} The fully processed node.
     */
    addNode(node: BrowsedNode): Promise<BrowsedNode | null>;
    /**
     * Returns `true` for node ids that should be treated as external references.
     * @param {string|number} idValue Value of the id to check.
     * @return {boolean} If the id should be treated as external.
     */
    _isExternalReference(idValue: string | number): boolean;
    /**
     * Returns `true` if a node has dependencies it should be queued behind.
     * @param {BrowsedNode} node The node to check.
     */
    _hasDependencies(node: BrowsedNode): boolean;
    /**
     * Processes a single node: Requires special error handling.
     * @param {BrowsedNode} node The node to process.
     * @return {Promise<?BrowsedNode>} The fully processed node.
     */
    _process(node: BrowsedNode): Promise<BrowsedNode | null>;
    /**
     * Discovers and browses the source nodes.
     * @param {Array<string, NodeId>} nodeIds The source ids.
     * @return {Promise<Node[]>} Resolved once finished.
     */
    _getSourceNodes(nodeIds: Array<string, NodeId>): Promise<any[]>;
    /**
     * Starts the browser of the given nodes.
     * @param {NodeId[]} nodeIds The nodes to browse.
     * @return {Promise<any>} Resolved once all nodes are finished.
     */
    browse(nodeIds: NodeId[]): Promise<any>;
    _sourceNodesRegExp: RegExp;
    _session: any;
    _reject: (err: any) => void;
}
import { ServerNode } from "../model/Node";
import NodeId from "../model/opcua/NodeId";
