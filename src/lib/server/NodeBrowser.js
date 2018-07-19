import { ObjectIds, browse_service as BrowseService } from 'node-opcua';
import Logger from 'gulplog';
import NodeId from '../model/opcua/NodeId';
import { ServerNode, ReferenceTypeIds } from '../model/Node';
import Session from './Session';

const HierachicalReferencesTypeIds = new Set([
  ReferenceTypeIds.HasChild,
  ReferenceTypeIds.Aggregates,
  ReferenceTypeIds.HasComponent,
  ReferenceTypeIds.HasOrderedComponent,
  ReferenceTypeIds.HasHistoricalConfiguration,
  ReferenceTypeIds.HasProperty,
  ReferenceTypeIds.HasSubtype,
  ReferenceTypeIds.HasEventSource,
  ReferenceTypeIds.HasNotifier,
  ReferenceTypeIds.Organizes,
]);

export class BrowsedNode extends ServerNode {

  constructor({ parent, reference }) {
    super({
      parent,
      nodeClass: reference.nodeClass,
      name: reference.browseName.name,
    });

    this.addReference(ReferenceTypeIds.toParent, reference.referenceTypeId.value);
    this.id = reference.nodeId;
  }

  addReferences(references) {
    references.forEach(reference => {
      this.addReference(reference.referenceTypeId.value, reference.nodeId.value);
    });
  }

  createChild(options) {
    const node = super.createChild(options);

    node.id = this.id;

    return node;
  }

}

export default class NodeBrowser {

  constructor({ nodes, ignoreNodes, recursive }/* : { nodes: NodeId[] } */ = {}) {
    this._sourceNodes = nodes;
    this._sourceNodesRegExp = new RegExp(`^(${nodes
      .map(({ value }) => `${value.replace(/\./g, '\\.')}`)
      .join('|')})`);

    this._ignoreNodesRegExp = new RegExp(`^(${ignoreNodes
      .map(n => n.value)
      .join('|')})`);

    this._recursive = recursive;

    this._discoveredNodes = [];
    this._nextToBrowse = [];
    this._queued = new Set();
    this._pushed = new Set();
    this._dependingNodes = {};
    this._dependencies = {};
    this._ended = false;

    Session.create()
      .then(session => (this._session = session))
      .then(() => this._getSourceNodes())
      .then(() => this._browseNext())
      .catch(err => this.onError(err));
  }

  disconnect() {
    return Session.close(this._session);
  }

  destroy() {
    this.stop();
    this._isDestroyed = true;

    return this.disconnect();
  }

  _browse(nodes) {
    return new Promise((resolve, reject) => {
      this._session.browse(nodes, (err, results) => {
        if (err) { return reject(err); }
        return resolve(results);
      });
    });
  }

  _readValues(nodes) {
    return new Promise((resolve, reject) => {
      this._session.readVariableValue(nodes, (err, results) => {
        if (err) { return reject(err); }
        return resolve(results);
      });
    });
  }

  _discoveredNode(node) {
    let dependencyCount = 0;

    for (const references of node.references.values()) {
      for (const reference of references) {
        if (
          reference.namespace &&
          !this._pushed.has(reference) &&
          !this._sourceNodesRegExp.test(reference)
        ) {
          this._dependingNodes[reference] = this._dependingNodes[reference] || [];
          this._dependingNodes[reference].push(node);
          dependencyCount += 1;
        }
      }
    }

    if (dependencyCount) { // has dependencies
      this._dependencies[node.id.value] = dependencyCount;
    } else {
      this._pushNode(node);
    }
  }

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

  async _getSourcePaths(nodes) {
    const paths = nodes.map(() => []);

    let browseNext = nodes.map((nodeId, index) => ({ nodeId, index }));
    const browsePath = async items => {
      browseNext = [];

      const results = await this._browse(items.map(({ nodeId }) => ({
        nodeId,
        browseDirection: BrowseService.BrowseDirection.Inverse,
        resultMask: 63,
      })));

      results.forEach((result, i) => {
        if (result.statusCode.value !== 0) {
          throw new Error(`Unable to browse ${items[i].nodeId}`);
        }

        for (const reference of result.references) {
          if (HierachicalReferencesTypeIds.has(reference.referenceTypeId.value)) {
            const index = items[i].index;

            if (reference.nodeId.value !== ObjectIds.RootFolder) {
              browseNext.push({ nodeId: reference.nodeId, index });
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

  async _browseSourcePaths(paths, targets) {
    const remainingPaths = paths;
    const nodes = new Array(paths.length);

    const browsePaths = async () => {
      const browse = [];
      remainingPaths.forEach((p, index) => {
        if (p.length) { browse.push({ nodeId: p.shift(), index }); }
      });

      const results = await this._browse(browse.map(({ nodeId }) => ({
        nodeId,
        browseDirection: BrowseService.BrowseDirection.Forward,
        resultMask: 63,
      })));

      results.forEach((result, i) => {
        const item = browse[i];
        const next = remainingPaths[item.index][0] || targets[item.index];

        for (const reference of result.references) {
          if (reference.nodeId.value === next.value) {
            nodes[item.index] = new BrowsedNode({
              parent: nodes[item.index],
              reference,
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

  _getSourceNodes() {
    return this._getSourcePaths(this._sourceNodes)
      .then(paths => this._browseSourcePaths(paths, this._sourceNodes))
      .then(nodes => {
        nodes.forEach(node => this._nextToBrowse.push(node));
      });
  }

  async _browseNext() {
    if (this._isDestroyed) { return Promise.resolve(); }

    const browseCount = Math.min(this._nextToBrowse.length, 10000);
    Logger.debug('browsing', browseCount, 'nodes...');
    const browseNow = this._nextToBrowse.splice(0, browseCount);

    const [results, values] = await Promise.all([
      this._browse(browseNow.map(node => ({
        nodeId: node.id,
        browseDirection: BrowseService.BrowseDirection.Forward,
        resultMask: 63,
      }))),
      this._readValues(browseNow.map(node => node.id)),
    ]);

    const isChildReference = (parent, reference) => {
      const [prefix, postfix] = reference.nodeId.value.split(parent.id.value);

      return prefix === '' && postfix/* .slice(1) === reference.browseName.name */;
    };

    results.forEach((result, i) => {
      const node = browseNow[i];
      const references = [];

      // FIXME: Check status
      node.value = values[i].value;

      result.references.forEach(reference => {
        // "Cast" ref.nodeId to NodeId
        Object.setPrototypeOf(reference.nodeId, NodeId.prototype);

        if (
          HierachicalReferencesTypeIds.has(reference.referenceTypeId.value) &&
          isChildReference(node, reference) &&
          !this._ignoreNodesRegExp.test(reference.nodeId.value)
        ) {
          if (!this._queued.has(reference.nodeId.value) && this._recursive) {
            this._queued.add(reference.nodeId.value);
            this._nextToBrowse.push(new BrowsedNode({
              parent: node,
              reference,
            }));
          }
        } else if (reference.referenceTypeId.value !== 50) { // Added by atvise builder
          references.push(reference);
        }
      });

      node.addReferences(references);
      this._discoveredNode(node);
    });

    if (this._nextToBrowse.length) {
      return this._browseNext();
    }

    // All nodes have been browsed
    if (this._isStopped) {
      this._ended = true;
      return Promise.resolve();
    }
    return this.onEnd();
  }

  start() {
    this._isStopped = false;

    while (this._discoveredNodes.length) {
      this.onNode(this._discoveredNodes.shift());
      if (this._isStopped) { break; }
    }

    if (!this._discoveredNodes.length && this._ended) {
      this.onEnd();
    }
  }

  stop() {
    this._isStopped = true;
  }

}
