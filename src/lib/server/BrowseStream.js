import { browse_service as BrowseService, NodeClass, ReferenceTypeIds} from 'node-opcua';
import QueueStream from './QueueStream';
import MappingItem from './MappingItem';
import NodeId from './NodeId';
import Project from '../../config/ProjectConfig';
import Logger from 'gulplog';

/**
 * List of valid reference types
 * @type {node-opcua~ReferenceTypeId{}}
 */
const ValidReferenceTypes = [
  ReferenceTypeIds.HasComponent,
  ReferenceTypeIds.HasProperty,
  ReferenceTypeIds.HasTypeDefinition,
  ReferenceTypeIds.HasSubtype,
  ReferenceTypeIds.HasEventSource,
  ReferenceTypeIds.HasNotifier,
  ReferenceTypeIds.HasHistoricalConfiguration,
  ReferenceTypeIds.HasModellingRule
];

/**
 * List of reference types that should be browsed
 * @type {node-opcua~ReferenceTypeId{}}
 */
const BrowseReferenceTypes = [
  ReferenceTypeIds.HasComponent,
  ReferenceTypeIds.HasProperty,
  ReferenceTypeIds.HasSubtype,
  ReferenceTypeIds.HasEventSource,
  ReferenceTypeIds.HasNotifier,
];

/**
 * List of reference types that are used for node metadata
 * @type {node-opcua~ReferenceTypeId{}}
 */
const AtviseReferenceTypes = [
  ReferenceTypeIds.HasEventSource,
  ReferenceTypeIds.HasNotifier,
  ReferenceTypeIds.HasHistoricalConfiguration,
  ReferenceTypeIds.Organizes
];

/**
 * List that contains node classes for type definitions
 * @type {node-opcua~NodeClass{}}
 */
const TypeDefinitionNodeClasses = [
  NodeClass.VariableType,
  NodeClass.ObjectType
];


/**
 * A stream that browses the nodes specified and (if *recursive* option is set) it's child nodes.
 */
export default class BrowseStream extends QueueStream {

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
   * Checks if the given non atvise reference should be mapped or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Boolean} reference should be pushed(=true) or not(=false)
   */
  static shouldBeMappedAsFile(ref, nodeId) {
    return (BrowseStream.isChildNodeRef(ref, nodeId) && BrowseStream.shouldBeMappedAsContentFile(ref)) ||
      BrowseStream.shouldBeMappedAsTypeDefinitionFile(ref);
  }

  /**
   * Checks if the given reference should be pushed to NodeStream input or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Boolean} reference should be pushed(=true) or not(=false)
   */
  static shouldBeBrowsed(ref, nodeId) {
    return BrowseReferenceTypes.indexOf(ref.referenceTypeId.value) > -1 &&
      BrowseStream.isChildNodeRef(ref, nodeId);
  }

  /**
   * Checks if the given reference points to a child node reference or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Boolean} reference points to a child node(=true) or not(=false)
   */
  static isChildNodeRef(ref, nodeId) {
    return ref.nodeId.toString().split(nodeId.value).length > 1;
  }


  /**
   * Checks if the given reference is a valid browse stream reference or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Boolean} reference is valid(=true) or not(=false)
   */
  static isValidRef(ref) {
    return ValidReferenceTypes.indexOf(ref.referenceTypeId.value) > -1;
  }

  /**
   * Checks if the given reference should be mapped as atvise reference file
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Boolean} reference should be mapped as atvise reference file(=true) or not(=false)
   */
  static shouldBeMappedAsAtviseReferenceFile(ref) {
    return AtviseReferenceTypes.indexOf(ref.referenceTypeId.value) > - 1;
  }

  /**
   * Checks if the given reference should be mapped as content file or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Boolean} reference should be mapped as content file(=true) or not(=false)
   */
  static shouldBeMappedAsContentFile(ref) {
    return ref.$nodeClass.value == NodeClass.Variable;
  }

  /**
   * Checks if the given reference should be mapped as type definition file or not
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Boolean} reference should be mapped as type definition(=true) or not(=false)
   */
  static shouldBeMappedAsTypeDefinitionFile(ref) {
    let referenceType = ref.referenceTypeId.value;

    return referenceType == ReferenceTypeIds.HasTypeDefinition ||
      referenceType == ReferenceTypeIds.HasSubtype;
  }

  /**
   * Casts the nodeId object of the given reference description to a NodeId object
   * @param{node-opcua~ReferenceDescription} ref The reference description to cast
   */
  static opcNodeIdToExpandedNodeId(ref) {
    // "cast" reference nodeId to NodeId
    Object.setPrototypeOf(ref.nodeId, NodeId.prototype);
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
   * Checks if the given reference matches the defined browse Filters
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @param{node-opcua~NodeId} nodeId The browsed nodeId
   * @return {Boolean} reference matches browse filters(=true) or not(=false)
   */
  matchesFilter(ref, nodeId) {
    return BrowseStream.isValidRef(ref) && !this.isIgnored(ref);
  }

  /**
   * Checks if the given reference description is ignored
   * @param{node-opcua~ReferenceDescription} ref The reference description to check
   * @return {Boolean} The given reference description should be ignored(=true) or not(=false)
   */
  isIgnored(ref) {
    let refNodeId = ref.nodeId.value.toString();

    if (refNodeId.match(this.ignoredRegExp)) {
      Logger.info(`Ignored node: ${refNodeId}`);
      return true;
    }
    return false;
  }

  /**
   * Returns {MappingItem}s for the given browse node id.
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
          let atvReferences = [];

          Promise.all(
            results[0].references
              // Remove parent nodes and ignore specified nodes
              .filter(ref => this.matchesFilter(ref, nodeId))
              // Push variable and object nodes, recurse
              .map(ref => {
                BrowseStream.opcNodeIdToExpandedNodeId(ref);

                if(BrowseStream.shouldBeMappedAsAtviseReferenceFile(ref)) {
                  atvReferences.push(ref);
                } else if (BrowseStream.shouldBeMappedAsFile(ref, nodeId)) {
                  this.push(new MappingItem(nodeId, ref));
                }

                // Only browse variable types and objects recursively
                if (this.recursive && BrowseStream.shouldBeBrowsed(ref, nodeId)) {
                  return new Promise((resolve) => {
                    this.write(ref.nodeId, null, resolve);
                  });
                }
              })
          )
            .then(result => {
              if (atvReferences.length > 0) {
                this.push(new MappingItem(nodeId, atvReferences));
              }
              done();
            });
        });
      }
    });
  }
}