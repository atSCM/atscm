import { browse_service as BrowseService, NodeClass } from 'node-opcua';
import QueueStream from './QueueStream';
import NodeId from './NodeId';
import Project from '../../config/ProjectConfig';

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
    this.ignoredRegExp = new RegExp(`^(${ignoreNodes.map(n => n.toString()).join('|')})`);

    // Write nodes to read
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
   * Returns a {ReadStream.ReadResult} for the given reference description.
   * @param {NodeId} nodeId The node id to browse.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(nodeId, handleErrors) {
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
            // Remove parent nodes
              .filter(ref => ref.nodeId.value.toString().split(nodeId.value).length > 1)
              // Ignore specified nodes
              // TODO: Print ignored nodes (debug level)
              .filter(ref => !(ref.nodeId.toString().match(this.ignoredRegExp)))
              // Push variable nodes, recurse
              .map(ref => {
                // Push all variable ids
                if (ref.nodeClass.value === NodeClass.Variable.value) {
                  // "Cast" ref.nodeId to NodeId
                  Object.setPrototypeOf(ref.nodeId, NodeId.prototype);

                  this.push(ref);
                }

                if (this.recursive) {
                  return new Promise((resolve) => {
                    this.write(ref.nodeId, null, resolve);
                  });
                }

                return Promise.resolve();
              })
          )
            .then(done);
        });
      }
    });
  }

}
