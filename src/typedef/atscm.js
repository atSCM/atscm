/**
 * @typedef {Object} NodeStream.BrowseResult
 * @property {NodeId} nodeId The discovered node's id.
 * @property {node-opcua~NodeClass} nodeClass The discovered node's class.
 * @property {Map<String, NodeId[]>} references An object holding arrays of references from the
 * discovered node to others, mapped by {@link node-opcua~ReferenceTypeId} keys.
 */

/**
 * @typedef {NodeStream.BrowseResult} ReadStream.ReadResult
 * @property {?node-opcua~DataValue} value For *Variable* nodes this property holds the read data
 * value.
 * @property {?Date} mtime For *Variable* nodes this property holds the timestamp the node's value
 * last changed.
 */
