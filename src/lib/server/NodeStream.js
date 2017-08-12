import { browse_service as BrowseService, NodeClass, ReferenceTypeIds} from 'node-opcua';
import QueueStream from './QueueStream';
import NodeId from './NodeId';
import Project from '../../config/ProjectConfig';
import Logger from 'gulplog';

/**
 * Object that contains the corresponding derived types for object and
 * variable types
 * @type {node-opcua~NodeClass{}}
 */
const NodeClassForTypeDefinition = {
  [NodeClass.VariableType]: NodeClass.Variable,
  [NodeClass.ObjectType] : NodeClass.Object,
};

/**
 * List of valid reference types
 * @type {node-opcua~ReferenceTypeId{}}
 */
const ValidReferenceTypes = [
  ReferenceTypeIds.HasComponent,
  ReferenceTypeIds.HasProperty,
  ReferenceTypeIds.HasTypeDefinition,
  ReferenceTypeIds.HasSubtype
];

/**
 * A stream that browses the nodes specified and (if *recursive* option is set) it's child nodes.
 */
export default class NodeStream extends QueueStream {

  /**
   * Creates a new NodeStream based on the nodes to start browsing with and some options.
   * @param {NodeId[]} nodesToBrowse The nodes to start browsing with.
   * @param {Object} [options] The options to use.
   * @param {Boolean} [options.recursive=true] If the discovered nodes should be browsed as well.
   * @param {NodeId[]} [options.ignoreNodes=ProjectConfig.ignoreNodes] An array of {@link NodeId}s
   * to ignore.
   */
  constructor(nodesToBrowse, options = {}) {
    if (!nodesToBrowse || !(nodesToBrowse instanceof Array) || nodesToBrowse.length === 0) {
      throw new Error('nodesToBrowse is required');
    }

    if (options && options.ignoreNodes && !(options.ignoreNodes instanceof Array)) {
      throw new Error('ignoreNodes must be an array of node ids');
    }

    super(options);

    // Handle options
    /**
     * If the discovered nodes should be browsed as well.
     * @type {Boolean}
     */
    this.recursive = true;
    if (options.recursive !== undefined) {
      this.recursive = options.recursive;
    }

    let ignoreNodes = Project.ignoreNodes;
    if (options.ignoreNodes !== undefined) {
      ignoreNodes = options.ignoreNodes;
    }

    /**
     * The result mask to use.
     * @type {UInt32}
     */
    this._resultMask = BrowseService.makeResultMask('ReferenceType | NodeClass | TypeDefinition');

    /**
     * A regular expression matching all node ids specified in {@link NodeStream#ignoreNodes}
     * @type {RegExp}
     */
    this.ignoredRegExp = new RegExp(`^(${ignoreNodes.map(n => n.value.toString()).join('|')})`);

    // Write nodes to read
    // Append nodes to queue
    nodesToBrowse.forEach(nodeId => this.write(nodeId));

    // End once drained
    this.once('drained', () => {
      this.end();
    });
  }

  /**
   * Returns an error message specifically for the given nodeId.
   * @param {NodeId} nodeId The node id to get the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(nodeId) {
    return `Error browsing ${nodeId.toString()}`;
  }

  /**
   * Changes reference properties if the reference is a type definition
   * for proper handling in type definition stream
   * @param{node-opcua~ReferenceDescription} reference description which gets checked
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   */
  convertRefToTypeDef(ref, nodeId) {
    ref.isTypeDef = true;
    ref.$nodeClass = NodeClassForTypeDefinition[ref.$nodeClass];
    ref.typeDefinition = ref.nodeId;
    ref.nodeId = nodeId;
  }

  /**
   * Checks if the given reference matches the defined browse Filters
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Bool} reference matches browse filters(=true) or not(=false)
   */
  matchesFilter(ref, nodeId) {
    let refNodeId = ref.nodeId.toString();
    let test = refNodeId.split(nodeId.value);
    let test2 = NodeClassForTypeDefinition.hasOwnProperty(ref.$nodeClass);


    // Only let valid reference types and object and variable types pass
    return ValidReferenceTypes.indexOf(ref.referenceTypeId.value) > -1 &&
      (NodeClassForTypeDefinition.hasOwnProperty(ref.$nodeClass) ||
        ref.nodeId.toString().split(nodeId.value).length > 1) && !this.isIgnored(ref)
  }

  /**
   * Checks if the given reference matches the defined browse Filters
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference is a type definition(=true) or not(=false)
   */
  isTypeDefinition(ref) {
    return ref.referenceTypeId.value === ReferenceTypeIds.HasTypeDefinition;
  }

  /**
   * Checks if the given reference should be pushed to NodeStreamOutput or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} reference sould be pushed(=true) or not(=false)
   */
  shouldBePushed(ref) {
    return ref.$nodeClass.value === NodeClass.Object.value ||
      ref.referenceTypeId.value === ReferenceTypeIds.HasSubtype;
  }

  /**
   * Checks if the given rference description is ignored
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Bool} Result of the check
   */
  isIgnored(ref) {
    let refNodeId = ref.nodeId.value.toString();

    if (refNodeId.match(this.ignoredRegExp)) {
      Logger.debug(`Ignored node: ${refNodeId}`);
      return true;
    }
    return false;
  }

  /**
   * Pushes the given reference to output of NodeStream
   * @param{node-opcua~ReferenceDescription} ref The reference description to push
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Bool} Type definition got pushed(=true) or variable type(=false)
   */
  pushReference(ref, nodeId) {
    let isTypeDef = this.isTypeDefinition(ref);

    if (isTypeDef) {
      this.convertRefToTypeDef(ref, nodeId);
    }

    // "cast" reference nodeId to NodeId
    Object.setPrototypeOf(ref.nodeId, NodeId.prototype);
    this.push(ref); // write ref to Nodestream output (stdout)

    return isTypeDef;
  }

  /**
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {NodeId} nodeId The node id to browse.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(nodeId, handleErrors) {
    // browses forward
    this.session.browse({
      nodeId,
      browseDirection: BrowseService.BrowseDirection.Forward,
      includeSubtypes: true,
      resultMask: this._resultMask,
    }, (err, results) => {
      if (!err && (!results || results.length === 0)) {
        handleErrors(new Error('No results'));
      } else {
        handleErrors(err, results && results.length > 0 ? results[0].statusCode : null, done => {
          Promise.all(
            results[0].references
              // Remove parent nodes and ignore specified nodes
              .filter(ref => this.matchesFilter(ref, nodeId))
              // Push variable and object nodes, recurse
              .map(ref => {
                // only push non object components to NodeStream output
                let browseRef = this.shouldBePushed(ref) ? true :
                  !this.pushReference(ref, nodeId);

                // Only browse variable types and objects recursively
                if (this.recursive && browseRef) {
                  return new Promise((resolve) => {
                    // add ref nodeid as chunk to NodeStream queue (stdin) --> recursive browsing of nodes
                    this.write(ref.nodeId, null, resolve);
                  });
                }

                return Promise.resolve();
              })
          )
            .then(done); // when all references (per browsed nodeId) have been processed, done callback is fired
                         // then the read stream can process the given data chunk by chunk
        });
      }
    });
  }

}
