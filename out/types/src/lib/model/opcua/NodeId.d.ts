/**
 * A wrapper around {@link node-opcua~NodeId}.
 */
export default class NodeId {
    /**
     * Creates a new NodeId based on a file path.
     * @param {string} path The file path to use.
     * @return {NodeId} The resulting NodeId.
     */
    static fromFilePath(path: string): NodeId;
    /**
     * Creates a new NodeId. Can be called in multiple ways:
     *  - with a {@link node-opcua~NodeIdType}, a value and a namespace (defaults to 0),
     *  - with a value only (type will be taken from it, namespace defaults to 1) or
     *  - with a {@link NodeId}s string representation (for example `ns=1;s=AGENT.DISPLAYS`).
     * @param {node-opcua~NodeIdType|string|number} typeOrValue The type or value to use.
     * @param {(number|string)} [value] The value to use.
     * @param {number} [namespace=1] The namespace to use.
     */
    constructor(typeOrValue: any, value?: string | number, namespace?: number);
    /**
     * The node id's value, encoded to a file path.
     * @type {string}
     */
    get filePath(): string;
    /**
     * Returns the last separator in a string node id's path, e.g.:
     * - `'/'` for `ns=1;SYSTEM.LIBRARY.RESOURCES/index.htm`,
     * - `'.'` for `ns=1;AGENT.DISPLAYS.Main`.
     * @type {?string} `null` for non-string node ids, `'/'` for resource paths, `'.'` for regular
     * string node ids.
     */
    get _lastSeparator(): string;
    /**
     * The parent node id, or `null`.
     * @type {?NodeId}
     * @deprecated Doesn't work properly in some edge cases. Use AtviseFile#parentNodeId instead
     * whenever possible.
     */
    get parent(): NodeId;
    /**
     * Checks if the node is a child of another.
     * @param {NodeId} parent The possible parent to check.
     * @return {boolean} `true` if *this* is a child node of *parent*.
     */
    isChildOf(parent: NodeId): boolean;
    /**
     * The node id's browsename as string.
     * @type {string}
     */
    get browseName(): string;
    /**
     * Returns a string in the format "namespace value" that is printed when inspecting the NodeId
     * using {@link util~inspect}.
     * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
     * @param {number} depth The depth to inspect.
     * @param {Object} options The options to use.
     * @return {string} A string in the format "namespace value".
     */
    inspect(depth: number, options: any): string;
}
