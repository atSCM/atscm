import { Readable } from 'stream';
import { readdir as _readdir, stat as _stat, readFile as _readFile } from 'fs';
import { promisify } from 'util';
import { join, basename, dirname } from 'path';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { DataType, VariantArrayType } from 'node-opcua';
import Node, { ReferenceTypeIds } from '../model/Node';
import ProjectConfig from '../../config/ProjectConfig';
import { decodeVariant } from '../coding';

const readdir = promisify(_readdir);
const stat = promisify(_stat);
const readFile = promisify(_readFile);

export class SourceNode extends Node {

  constructor({ name, parent, nodeClass, nodeId, references, dataType, arrayType }) {
    super({ name, parent, nodeClass });

    this.value = {};

    if (nodeClass) {
      this.nodeClass = NodeClass[nodeClass];
    } else {
      this.nodeClass = NodeClass.Variable;
    }

    if (nodeId) {
      this.specialId = nodeId;
    } else {
      throw new Error('no nodeid');
    }

    if (references) {
      Object.entries(references).forEach(([ref, ids]) => {
        const type = ReferenceTypeIds[ref];

        ids.forEach(id => {
          this.references.addReference(type, id);
          this._resolvedReferences.addReference(type, id);
        });
      });
    }

    if (dataType) {
      this.value.dataType = DataType[dataType];
    }

    if (arrayType) {
      this.value.arrayType = VariantArrayType[arrayType];
    }
  }

  get variantValue() {
    const value = this.value;

    if (!value.value) {
      value.value = decodeVariant(this._rawValue, value);
    }

    return value;
  }

}

export class SourceBrowser {

  constructor({ path, base, ignoreNodes }) {
    this._sourceNodesRegExp = new RegExp(`^(${ProjectConfig.nodes
      .map(({ value }) => `${value.replace(/\./g, '\\.')}`)
      .join('|')})`);

    this._ignoreNodesRegExp = new RegExp(`^(${ignoreNodes || ProjectConfig.ignoreNodes
      .map(n => n.value)
      .join('|')})`);

    this._isStopped = true;
    this._isDestroyed = false;
    this._ended = false;
    this._readNodes = [];

    this._base = base || path;
    this._nextToBrowse = [];
    this._nextToStat = [];
    this._nextToRead = [];

    this._waitingForParent = {};
    this._discoveredNodes = new Map();
    this._pushedNodes = new Set();
    this._dependingNodes = {};
    this._dependencies = {};

    this._stat([path])
      .then(() => this._processQueues())
      .catch(err => this.onError(err));
  }

  _nextInQueue(queue) {
    const count = Math.min(queue.length, 50);
    return queue.splice(0, count);
  }

  _processQueue(queue, handler) {
    const input = this._nextInQueue(queue);

    if (!input.length) {
      return Promise.resolve();
    }

    return handler(input)
      .then(() => this._processQueue(queue, handler));
  }

  _browse(dirs) {
    return Promise.all(dirs
      .map(dir => readdir(dir)
        .then(files => files.forEach(file => {
          this._nextToStat.push(join(dir, file));
        }))
      )
    );
  }

  _isDefinitionFile(path) {
    return basename(path).match(/^\..*\.json$/);
  }

  _isNonVarFile(path) {
    const t = basename(path).slice(1).replace(/\.json$/, '');

    if (t.length < 4) { return false; }

    return Boolean(NodeClass[t]);
  }

  _parentNodePath(path) {
    let dir = dirname(path);

    if (this._isNonVarFile(path)) {
      dir = dirname(dir);
    }

    return dir.replace(/.inner$/, '');
  }

  _isRootNodePath(path) {
    // MARK: Only works with compact mapping applied, update once configurable.
    // FIXME: Needs a more general solution.
    // eslint-disable-next-line max-len
    return /^src.(AGENT|SYSTEM|ObjectTypes.PROJECT|VariableTypes.PROJECT).\.(Object|ObjectType|VariableType)?.json$/.test(path);
  }

  _stat(paths) {
    return Promise.all(paths
      .map(path => stat(path)
        .then(s => {
          if (s.isDirectory()) {
            this._nextToBrowse.push(path);
          } else if (s.isFile()) {
            if (this._isDefinitionFile(path)) {
              const parentPath = this._parentNodePath(path);
              if (this._isRootNodePath(path) || this._pushedNodes.has(parentPath)) {
                this._nextToRead.push(path);
              } else {
                this._waitingForParent[parentPath] = (this._waitingForParent[parentPath] || [])
                  .concat(path);
              }
            } // Got a regular / variable value file
          }
        })
      )
    );
  }

  _read(paths) {
    return Promise.all(paths
      .map(path => readFile(path)
        .then(contents => {
          if (this._isDefinitionFile(path)) {
            this._discoveredNode({ path, definitions: JSON.parse(contents.toString()) });
          } else {
            const node = this._discoveredNodes.get(path);

            if (!node) {
              throw new Error(`Unknown node at ${path}`);
            }

            node._rawValue = contents;
            this._pushNode(node);
          }
        })
      )
    );
  }

  async _processQueues() {
    if (this._isDestroyed) { return true; }

    await Promise.all([
      this._processQueue(this._nextToBrowse, this._browse.bind(this)),
      this._processQueue(this._nextToStat, this._stat.bind(this)),
      this._processQueue(this._nextToRead, this._read.bind(this)),
    ]);

    if (this._nextToBrowse.length || this._nextToStat.length || this._nextToRead.length) {
      return this._processQueues();
    }

    if (this._isStopped) {
      this._ended = true;
      return true;
    }

    if (Object.keys(this._dependingNodes).length) {
      throw new Error('Unmapped nodes');
    }

    if (Object.keys(this._waitingForParent).length) {
      throw new Error('Unmapped nodes');
    }

    if (Object.keys(this._dependencies).length) {
      throw new Error('Unmapped nodes');
    }

    return this.onEnd();
  }

  // Dependency management

  _discoveredNode({ path: _path, definitions }) {
    let path = _path;
    let name = basename(path).slice(1).replace(/\.json$/, '');

    if (name.length >= 4 && NodeClass[name]) {
      path = dirname(path);
      name = basename(path);
    }

    const dir = dirname(path);
    const parentPath = this._parentNodePath(path);
    const relative = join(dir, name);
    const node = new SourceNode(Object.assign({
      name,
      parent: this._discoveredNodes.get(parentPath),
    }, definitions));
    node.relative = relative;
    this._discoveredNodes.set(relative, node);

    let dependencyCount = 0;

    if (!this._pushedNodes.has(parentPath) && !this._isRootNodePath(_path)) {
      throw new Error(`'${path}' was pushed before parent node`);
    }

    for (const [type, references] of node.references.entries()) {
      if (type !== ReferenceTypeIds.toParent) {
        for (const reference of references) {
          if (
            type !== ReferenceTypeIds.toParent && // parents are handled via _waitingForParent
            !this._pushedNodes.has(reference) && // hasn't been processed yet
            this._sourceNodesRegExp.test(reference) && // is included in project config
            !this._ignoreNodesRegExp.test(reference) // is not ignored in project config
          ) {
            this._dependingNodes[reference] = this._dependingNodes[reference] || [];
            this._dependingNodes[reference].push(node);
            dependencyCount += 1;
          }
        }
      }
    }

    if (dependencyCount) { // has deps
      this._dependencies[node.nodeId] = dependencyCount;
    } else {
      this._readNodeValue(node);
    }
  }

  _readNodeValue(node) {
    if (node.nodeClass === NodeClass.Variable) {
      this._nextToRead.push(node.relative);
    } else {
      this._pushNode(node);
    }
  }

  _pushNode(node) {
    this._pushedNodes.add(node.relative);
    this._pushedNodes.add(node.nodeId);
    this.onNode(node);

    // FIXME: Only while debugging
    if (!node.parent && ![
      'AGENT',
      'SYSTEM',
      'VariableTypes.PROJECT',
      'ObjectTypes.PROJECT',
    ].includes(node.nodeId)) {
      throw new Error(`Node '${node.nodeId}' has no parent node`);
    }

    const waiting = this._waitingForParent[node.relative];
    if (waiting) {
      waiting.forEach(p => {
        this._nextToRead.push(p);
      });

      delete this._waitingForParent[node.relative];
    }

    const dependents = this._dependingNodes[node.nodeId];

    if (dependents) {
      dependents.forEach(dep => {
        this._dependencies[dep.nodeId]--;

        if (this._dependencies[dep.nodeId] === 0) {
          this._readNodeValue(dep);
          delete this._dependencies[dep.nodeId];
        } // else: dependent has other dependencies as well
      });

      delete this._dependingNodes[node.nodeId];
    }
  }

  async destroy() {
    this.stop();
    this._isDestroyed = true;
  }

  start() {
    this._isStopped = false;

    while (this._readNodes.length) {
      this.onNode(this._readNodes.shift());
      if (this._isStopped) { break; }
    }

    if (!this._readNodes.length && this._ended) {
      this.onEnd();
    }
  }

  stop() {
    this._isStopped = true;
  }

}

export class SourceStream extends Readable {

  constructor(options) {
    super(Object.assign(options, { objectMode: true, highWaterMark: 10000 }));

    this._browser = new SourceBrowser(options);

    this._browser.onNode = node => {
      if (!this.push(node)) { this._browser.stop(); }
    };

    this._browser.onEnd = () => {
      this.push(null);
      this.destroy();
    };

    this._browser.onError = err => {
      if (this.isDestroyed) { return; }
      this.emit('error', err);
      this.destroy();
    };
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  _read() {
    this._browser.start();
  }

  _destroy(err, callback) {
    this._isDestroyed = true;

    super.destroy(err, () => {
      this._browser.destroy()
        .then(() => callback(err))
        .catch(destroyErr => callback(err || destroyErr));
    });
  }

}

export default function src(path, options = {}) {
  return new SourceStream(Object.assign(options, { path }));
}
