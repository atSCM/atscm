import { browse_service as BrowseService, NodeClass } from 'node-opcua';
import Logger from 'gulplog';
import Stream from './Stream';
import NodeId from './NodeId';
import Project from '../../config/ProjectConfig';

/**
 * An object transform stream that browses atvise server and pushes the resulting
 * {@link node-opcua~ReferenceDescription}s.
 */
export default class NodeStream extends Stream {

  /**
   * Creates a new NodesStream based on the nodes to start browsing at and some options.
   * @param {NodeId[]} nodesToBrowse The nodes to start browsing at.
   * @param {Object} [options] The options to use.
   * @param {NodeId[]} [options.ignoreNodes=ProjectConfig.ignoreNodes] An array of {@link NodeId}s
   * to ignore.
   * @param {Boolean} [options.recursive=true] If the discovered nodes should be browsed as well.
   * @param {Number} [options.maxRetries=3] How often failing browse requests should be retried.
   * implemented yet*).
   */
  constructor(nodesToBrowse, options) {
    if (!nodesToBrowse || !(nodesToBrowse instanceof Array)) {
      throw new Error('nodes is required');
    }

    if (options && options.ignoreNodes !== undefined && !(options.ignoreNodes instanceof Array)) {
      throw new Error('ignoreNodes must be an array of node ids');
    }

    super();

    this.once('session-open',
      () => this.browseNodes(nodesToBrowse)
        .then(() => this.end())
        .catch(err => this.emit('error', err))
      );

    // Handle options
    /**
     * If the discovered nodes should be browsed as well.
     * @type {Boolean}
     */
    this.recursive = true;

    /**
     * How often failing browse requests should be retried.
     * @type {Number}
     */
    this.maxRetries = 3;

    /**
     * An array of {@link NodeId}s to ignore.
     * @type {NodeId[]}
     */
    this.ignoreNodes = Project.ignoreNodes;

    if (options) {
      if (options.recursive !== undefined) {
        this.recursive = options.recursive;
      }

      if (options.ignoreNodes !== undefined) {
        this.ignoreNodes = options.ignoreNodes;
      }

      if (options.maxRetries !== undefined) {
        this.maxRetries = options.maxRetries;
      }
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
    this.ignoredRegExp = new RegExp(`^(${this.ignoreNodes.map(n => n.toString()).join('|')})`);
  }

  /**
   * Browses the given node.
   * @param {NodeId} nodeId The node to browse.
   * @param {Number} [retry=0] How often browsing was retried so far. **Do pass a value for this
   * parameter, it is only meant be used in recursion**
   * @return {Promise<NodeId[], Error>} Fulfilled with the next nodes to browse or rejected with the
   * error that occurred while browsing.
   */
  browseNode(nodeId, retry) {
    const promise = new Promise((resolve, reject) => {
      this.session.browse({
        nodeId,
        browseDirection: BrowseService.BrowseDirection.Forward,
        includeSubtypes: true,
        resultMask: this._resultMask,
      }, (err, results) => {
        if (err) {
          if (err.message === 'Transaction has timed out') {
            const tryNo = retry || 1;
            Logger.debug(`Timeout while browsing. Retrying... (${tryNo})`, nodeId.toString());

            if (retry && retry === this.maxRetries) {
              reject(
                new Error(`Browsing ${nodeId.toString()} failed: Timeout (${promise.retry}x)`)
              );
            } else {
              this.browseNode(nodeId, (tryNo + 1))
                .then(resolve, reject);
            }
          } else {
            reject(new Error(`Browsing ${nodeId.toString()} failed: ${err.message}`));
          }
        } else if (!results || results.length === 0) {
          reject(new Error(`Browsing ${nodeId.toString()} failed: No results`));
        } else if (results[0].statusCode > 0) {
          reject(new Error(`Browsing ${nodeId.toString()} failed: Code ${results[0].statusCode}`));
        } else {
          const browseNext = results[0].references
            // Remove parent nodes
            .filter(ref => ref.nodeId.value.toString().split(nodeId.value).length > 1)
            // TODO: Print ignored nodes (debug level)
            .filter(ref => !(ref.nodeId.toString().match(this.ignoredRegExp)))

            // Remove variable nodes
            .map(ref => {
              // Push all variable ids
              if (ref.nodeClass.value === NodeClass.Variable.value) {
                // "Cast" ref.nodeId to NodeId
                Object.setPrototypeOf(ref.nodeId, NodeId.prototype);

                this.push(ref);
              }

              return ref.nodeId;
            });

          resolve(browseNext);
        }
      });
    });

    if (this.recursive && retry === undefined) {
      return promise.then(childObjectNodes => this.browseNodes(childObjectNodes));
    }

    return promise;
  }

  /**
   * Browses the given nodes.
   * @param {NodeId[]} nodes The nodes to browse.
   * @return {Promise<?NodeId[], Error>} Rejected with the error that occurred, otherwise fulfilled
   * with the next nodes to browse.
   * If {@link NodeStream#recursive} is set to `true` this method is called recursively.
   */
  browseNodes(nodes) {
    return Promise.all(
      nodes.map(node => this.browseNode(node))
    );
  }

}
