"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.BrowsedNode = void 0;

var _opcua_node_ids = require("node-opcua/lib/opcua_node_ids.js");

var _browse_service = require("node-opcua/lib/services/browse_service.js");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass.js");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _Node = require("../model/Node");

var _Session = _interopRequireDefault(require("./Session"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A set of all hierarchical reference types.
 * @type {Set<number>}
 */
const HierachicalReferencesTypeIds = new Set([_Node.ReferenceTypeIds.HasChild, _Node.ReferenceTypeIds.Aggregates, _Node.ReferenceTypeIds.HasComponent, _Node.ReferenceTypeIds.HasOrderedComponent, _Node.ReferenceTypeIds.HasHistoricalConfiguration, _Node.ReferenceTypeIds.HasProperty, _Node.ReferenceTypeIds.HasSubtype, _Node.ReferenceTypeIds.HasEventSource, _Node.ReferenceTypeIds.HasNotifier, _Node.ReferenceTypeIds.Organizes]);
/**
 * A node discovered while browsing the server's database.
 */

class BrowsedNode extends _Node.ServerNode {
  /**
   * Creates a new node.
   * @param {Object} options The options to use.
   * @param {?BrowsedNode} options.parent The parent node.
   * @param {Object} options.reference The reference to pick metadata from.
   */
  constructor({
    parent,
    reference
  }) {
    super({
      parent,
      nodeClass: reference.nodeClass,
      name: reference.browseName.name
    });
    this.addReference(_Node.ReferenceTypeIds.toParent, reference.referenceTypeId.value);
    /** The node's id. @type {NodeId} */

    this.id = reference.nodeId;
  }
  /**
   * Add multiple references at once.
   * @param {Object[]} references The references to add.
   */


  addReferences(references) {
    references.forEach(reference => {
      this.addReference(reference.referenceTypeId.value, reference.nodeId.value);
    });
  }
  /**
   * Creates new child node.
   * @param {Object} options The options to use.
   * @see {Node#createChild}
   */


  createChild(options) {
    const node = super.createChild(options);
    node.id = this.id;
    return node;
  }

}
/**
 * Browses the server database.
 */


exports.BrowsedNode = BrowsedNode;

class NodeBrowser {
  /**
   * Creates a new browser.
   * @param {Object} options The options to use.
   * @param {NodeId[]} options.nodes The nodes to browse.
   * @param {NodeId[]} options.ignoreNodes The nodes to igore.
   * @param {boolean} options.recursive If the browser should recurse.
   */
  constructor({
    nodes,
    ignoreNodes,
    recursive
    /* : { nodes: NodeId[] } */

  } = {}) {
    /** The browser's source nodes @type {NodeId[]} */
    this._sourceNodes = nodes;
    /** A regular expression matching all source nodes. @type {RegExp} */

    this._sourceNodesRegExp = new RegExp(`^(${nodes.map(({
      value
    }) => `${value.replace(/\./g, '\\.')}`).join('|')})`);
    /** A regular expression matching all ignored nodes. @type {RegExp} */

    this._ignoreNodesRegExp = new RegExp(`^(${ignoreNodes.map(n => n.value).join('|')})`);
    /** If the browser should recurse. @type {boolean} */

    this._recursive = recursive;
    /** Nodes discovered but not yet pushed. @type {ServerNode[]} */

    this._discoveredNodes = [];
    /** Nodes that should be browsed next. @type {NodeId[]} */

    this._nextToBrowse = [];
    /** Nodes queued. @type {Set<string>} */

    this._queued = new Set();
    /** Nodes pushed. @type {Set<string>} */

    this._pushed = new Set();
    /** Node dependency map. @type {Map<string, SourceNode[]>} */

    this._dependingNodes = {};
    /** The count of dependencies for nodes. @type {Map<string, number>} */

    this._dependencies = {};
    /** If the browser is stopped. @type {boolean} */

    this._isStopped = false;
    /** If the browser is destroyed. @type {boolean} */

    this._isDestroyed = false;
    /** If the browser ended. @type {boolean} */

    this._ended = false;

    _Session.default.create().then(session => this._session = session).then(() => this._getSourceNodes()).then(() => this._browseNext()).catch(err => {
      if (!this._isDisconnected) {
        this.onError(err);
      }
    });
  }
  /**
   * Disconnects the browser.
   * @return {Promise<void>} Resolved once finished.
   */


  disconnect() {
    this._isDestroyed = true;
    return _Session.default.close(this._session);
  }
  /**
   * Destroys the browser.
   * @return {Promise<void>} Resolved once finished.
   */


  destroy() {
    this.stop();
    this._isDestroyed = true;
    return this.disconnect();
  }
  /**
   * Browses the given nodes.
   * @param {NodeId[]} nodes The nodes to browse.
   * @return {Promise<Object[]>} The browse results.
   */


  _browse(nodes) {
    return new Promise((resolve, reject) => {
      this._session.browse(nodes, (err, results) => {
        if (err) {
          return reject(err);
        }

        return resolve(results);
      });
    });
  }
  /**
   * Reads the given nodes.
   * @param {NodeId[]} nodes The nodes to read.
   * @return {Promise<Object[]>} The read results.
   */


  _readValues(nodes) {
    return new Promise((resolve, reject) => {
      this._session.readVariableValue(nodes, (err, results) => {
        if (err) {
          return reject(err);
        }

        return resolve(results);
      });
    });
  }
  /**
   * Called once a new node was discovered. Pushes it if possible.
   * @param {ServerNode} node The discovered node.
   */


  _discoveredNode(node) {
    let dependencyCount = 0;

    for (const references of node.references.values()) {
      for (const reference of references) {
        if (reference.namespace && !this._pushed.has(reference) && !this._sourceNodesRegExp.test(reference)) {
          this._dependingNodes[reference] = this._dependingNodes[reference] || [];

          this._dependingNodes[reference].push(node);

          dependencyCount += 1;
        }
      }
    }

    if (dependencyCount) {
      // has dependencies
      this._dependencies[node.id.value] = dependencyCount;
    } else {
      this._pushNode(node);
    }
  }
  /**
   * Pushes the given node and queues it's dependents.
   * @param {ServerNode} node The pushed node.
   */


  _pushNode(node) {
    if (!this._isStopped) {
      this.onNode(node);
    } else {
      this._discoveredNodes.push(node);
    }

    this._pushed.add(node.id.value);

    if (this._dependingNodes[node.id.value]) {
      this._dependingNodes[node.id.value].forEach(dependency => {
        this._dependencies[dependency.id.value] -= 1;

        if (this._dependencies[dependency.id.value] === 0) {
          this._pushNode(dependency);
        } // else: Still got dependencies

      });

      delete this._dependingNodes[node.id.value];
    }
  }
  /**
   * Browses the source node to the root node.
   * @param {NodeId[]} nodes The current nodes.
   * @return {Promise<string[]>} The discovered source path.
   */


  async _getSourcePaths(nodes) {
    const paths = nodes.map(() => []);
    let browseNext = nodes.map((nodeId, index) => ({
      nodeId,
      index
    }));

    const browsePath = async items => {
      browseNext = [];
      const results = await this._browse(items.map(({
        nodeId
      }) => ({
        nodeId,
        browseDirection: _browse_service.BrowseDirection.Inverse,
        resultMask: 63
      })));
      results.forEach((result, i) => {
        if (result.statusCode.value !== 0) {
          throw new Error(`Unable to browse ${items[i].nodeId}`);
        }

        for (const reference of result.references) {
          if (HierachicalReferencesTypeIds.has(reference.referenceTypeId.value)) {
            const index = items[i].index;

            if (reference.nodeId.value !== _opcua_node_ids.ObjectIds.RootFolder) {
              browseNext.push({
                nodeId: reference.nodeId,
                index
              });
            }

            paths[index].unshift(reference.nodeId);
            return;
          }
        }

        throw new Error(`Unable to get parent node of ${items[i].nodeId}`);
      });
    };

    while (browseNext.length) {
      await browsePath(browseNext);
    }

    return paths;
  }
  /**
   * Browses the source nodes's root paths.
   * @param {string[][]} paths The source paths.
   * @param {NodeId} targets The target nodes to browse onto.
   */


  async _browseSourcePaths(paths, targets) {
    const remainingPaths = paths;
    const nodes = new Array(paths.length);

    const browsePaths = async () => {
      const browse = [];
      remainingPaths.forEach((p, index) => {
        if (p.length) {
          browse.push({
            nodeId: p.shift(),
            index
          });
        }
      });
      const results = await this._browse(browse.map(({
        nodeId
      }) => ({
        nodeId,
        browseDirection: _browse_service.BrowseDirection.Forward,
        resultMask: 63
      })));
      results.forEach((result, i) => {
        const item = browse[i];
        const next = remainingPaths[item.index][0] || targets[item.index];

        for (const reference of result.references) {
          if (reference.nodeId.value === next.value) {
            nodes[item.index] = new BrowsedNode({
              parent: nodes[item.index],
              reference
            });
            return;
          }
        }

        throw new Error('Fatal error');
      });
    };

    while (remainingPaths.find(i => i.length)) {
      await browsePaths();
    }

    return nodes;
  }
  /**
   * Discovers and browses the source nodes.
   * @return {Promise<void>} Resolved once finished.
   */


  _getSourceNodes() {
    const validateSourceNodes = JSON.stringify(this._sourceNodes) === JSON.stringify(_ProjectConfig.default.nodes);
    return this._getSourcePaths(this._sourceNodes).then(paths => this._browseSourcePaths(paths, this._sourceNodes)).then(nodes => {
      nodes.forEach(node => {
        if (validateSourceNodes && node.nodeClass === _nodeclass.NodeClass.Variable) {
          throw new Error(`Source node '${node.id.value}' is not an Object.
 - You could use it's parent (${node.parent.id.value}) inside your project configuration instead.`);
        }

        this._nextToBrowse.push(node);
      });
    });
  }
  /**
   * Browses the next nodes queued.
   */


  async _browseNext() {
    if (this._isDestroyed) {
      return Promise.resolve();
    }

    const browseCount = Math.min(this._nextToBrowse.length, 10000);

    _gulplog.default.debug('browsing', browseCount, 'nodes...');

    const browseNow = this._nextToBrowse.splice(0, browseCount);

    const [results, values] = await Promise.all([this._browse(browseNow.map(node => ({
      nodeId: node.id,
      browseDirection: _browse_service.BrowseDirection.Forward,
      resultMask: 63
    }))), this._readValues(browseNow.map(node => node.id))]);
    results.forEach((result, i) => {
      const node = browseNow[i];
      const references = []; // FIXME: Check status

      node.value = values[i].value;
      result.references.forEach(reference => {
        // "Cast" ref.nodeId to NodeId
        Object.setPrototypeOf(reference.nodeId, _NodeId.default.prototype);

        if (HierachicalReferencesTypeIds.has(reference.referenceTypeId.value) && !this._ignoreNodesRegExp.test(reference.nodeId.value)) {
          if (!this._queued.has(reference.nodeId.value) && this._recursive) {
            this._queued.add(reference.nodeId.value);

            this._nextToBrowse.push(new BrowsedNode({
              parent: node,
              reference
            }));
          }
        } else if (reference.referenceTypeId.value !== 50) {
          // Added by atvise builder
          references.push(reference);
        }
      });
      node.addReferences(references);

      this._discoveredNode(node);
    });

    if (this._nextToBrowse.length) {
      return this._browseNext();
    } // All nodes have been browsed


    if (this._isStopped) {
      this._ended = true;
      return Promise.resolve();
    }

    return this.onEnd();
  }
  /**
   * Starts the browser.
   */


  start() {
    this._isStopped = false;

    while (this._discoveredNodes.length) {
      this.onNode(this._discoveredNodes.shift());

      if (this._isStopped) {
        break;
      }
    }

    if (!this._discoveredNodes.length && this._ended) {
      this.onEnd();
    }
  }
  /**
   * Stops the browser.
   */


  stop() {
    this._isStopped = true;
  }

}

exports.default = NodeBrowser;
//# sourceMappingURL=NodeBrowser.js.map