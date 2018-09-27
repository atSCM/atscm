"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = src;
exports.SourceStream = exports.SourceBrowser = exports.FileNode = void 0;

var _stream = require("stream");

var _fs = require("fs");

var _util = require("util");

var _path2 = require("path");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _nodeOpcua = require("node-opcua");

var _Node = require("../model/Node");

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _coding = require("../coding");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** Browses the given directory @type {function(path: string): Promise<string[]>} */
const readdir = (0, _util.promisify)(_fs.readdir);
/** Stats the given file @type {function(file: string): Promise<fs~Stat>} */

const stat = (0, _util.promisify)(_fs.stat);
/** Reads the given file @type {function(file: string): Promise<Buffer>} */

const readFile = (0, _util.promisify)(_fs.readFile);
/**
 * A node returned by the {@link SourceStream}.
 */

class FileNode extends _Node.SourceNode {
  /**
   * Creates a new node.
   * @param {Object} options The options to use.
   */
  constructor({
    name,
    parent,
    nodeClass,
    nodeId,
    references,
    dataType,
    arrayType
  }) {
    super({
      name,
      parent,
      nodeClass
    });
    /**
     * A node's value (may be incomplete, use {@link FileNode#variantValue} to ensure).
     * @type {node-opcua~Variant}
     */

    this.value = {};

    if (nodeClass) {
      /**
       * The node's class.
       * @type {node-opcua~NodeClass}
       * */
      this.nodeClass = _nodeclass.NodeClass[nodeClass];
    } else {
      this.nodeClass = _nodeclass.NodeClass.Variable;
    }

    if (nodeId) {
      /**
       * The id stored in the definition file
       * @type {NodeId}
      */
      this.specialId = nodeId;
    }

    if (references) {
      Object.entries(references).forEach(([ref, ids]) => {
        const type = _Node.ReferenceTypeIds[ref];
        ids.forEach(id => {
          this.references.addReference(type, id);

          this._resolvedReferences.addReference(type, id);
        });
      });
    }

    if (dataType) {
      this.value.dataType = _nodeOpcua.DataType[dataType];
    }

    if (arrayType) {
      this.value.arrayType = _nodeOpcua.VariantArrayType[arrayType];
    }
  }
  /**
   * A node's raw value, decoded into a string.
   * @type {string}
   */


  get stringValue() {
    return this._rawValue.toString();
  }
  /**
   * A node's {@link node-opcua~Variant} value.
   * @type {node-opcua~Variant}
   */


  get variantValue() {
    const value = this.value;

    if (!value.value) {
      value.value = (0, _coding.decodeVariant)(this._rawValue, value);
    }

    return value;
  }

}
/**
 * A stream that browses the file system and returns {@link Node}s from the read files.
 */


exports.FileNode = FileNode;

class SourceBrowser {
  /**
   * Creates a new browser.
   * @param {Object} options The options to use.
   * @param {string} options.path The path to browse for.
   * @param {string} [options.base] The base directory to use (defaults to './src').
   * @param {NodeId[]} [options.ignoreNodes] The nodes to ignore (defaults to the ones in the
   * project config.
   * @param {boolean} [options.recursive=true] If the browser shoud recurse directories.
   */
  constructor({
    path,
    base,
    ignoreNodes,
    recursive
  }) {
    /**
     * A regular expression matching all nodes specified in {@link ProjectConfig.nodes}.
     */
    this._sourceNodesRegExp = new RegExp(`^(${_ProjectConfig.default.nodes.map(({
      value
    }) => `${value.replace(/\./g, '\\.')}`).join('|')})`);
    /**
     * A regular expression matching all nodes specified in {@link ProjectConfig.nodes}.
     */

    this._ignoreNodesRegExp = new RegExp(`^(${ignoreNodes || _ProjectConfig.default.ignoreNodes.map(n => n.value).join('|')})`);
    /** If the browser is stopped. @type {boolean} */

    this._isStopped = true;
    /** If the browser is destoyed. @type {boolean} */

    this._isDestroyed = false;
    /** If the browser has ended. @type {boolean} */

    this._ended = false;
    /** Nodes discovered and read but not yet pushed. @type {FileNode[]} */

    this._readNodes = [];
    /** The directories discovered. @type {Set<string>} */

    this._isDir = new Set();
    /** The source path. @type {string} */

    this._path = path;
    /** The base path. @type {string} */

    this._base = base;
    /** If the browser should recurse directores. @type {boolean} */

    this._recursive = recursive;
    /** The browse queue. @type {string[]} */

    this._nextToBrowse = [];
    /** The stat queue. @type {string[]} */

    this._nextToStat = [];
    /** The read queue. @type {string[]} */

    this._nextToRead = [];
    /** Nodes waiting for it's parent to be pushed. @type {Map<string, string[]>} */

    this._waitingForParent = {};
    /** Nodes discovered but not read yet. @type {Map<string, FileNode>} */

    this._discoveredNodes = new Map();
    /** Paths of nodes already pushed. @type {Set<string>} */

    this._pushedNodes = new Set();
    /** Nodes that depend on others to be pushed. @type {Map<string, Set<FileNode>>} */

    this._dependingNodes = {};
    /** Numbers of dependencies for nodes at path. @type {Map<string, number>} */

    this._dependencies = {};

    this._stat([this._base]).then(() => this._processQueues()).catch(err => this.onError(err));
  }
  /**
   * Picks the next items from a queue.
   * @param {any[]} queue The queue to pick from.
   */


  _nextInQueue(queue) {
    const count = Math.min(queue.length, 50);
    return queue.splice(0, count);
  }
  /**
   * Processes the next items in a queue.
   * @param {any[]} queue The queue to process.
   * @param {function(input: any[]): Promise<any>} handler The handler to use.
   */


  _processQueue(queue, handler) {
    const input = this._nextInQueue(queue);

    if (!input.length) {
      return Promise.resolve();
    }

    return handler(input).then(() => this._processQueue(queue, handler));
  }
  /**
   * Browses the specified directories.
   * @param {string[]} dirs The directories to browse.
   * @return {Promise<void>} Resolved once finished.
   */


  _browse(dirs) {
    return Promise.all(dirs.map(dir => readdir(dir).then(files => files.forEach(file => {
      this._nextToStat.push((0, _path2.join)(dir, file));
    }))));
  }
  /**
   * Returns `true` for all definition file paths.
   * @param {string} path The path to check.
   * @return {boolean} If the item at the given path is a definition file.
   */


  _isDefinitionFile(path) {
    return (0, _path2.basename)(path).match(/^\..*\.json$/);
  }
  /**
   * Returns `true` for all non-variable definition file paths.
   * @param {string} path The pach to check.
   * @return {boolean} If the item at the given path is a definition file.
   */


  _isNonVarFile(path) {
    const t = (0, _path2.basename)(path).slice(1).replace(/\.json$/, '');

    if (t.length < 4) {
      return false;
    }

    return Boolean(_nodeclass.NodeClass[t]);
  }
  /**
   * Returns the path to the parent node.
   * @param {string} path The path to use.
   * @return {string} The parent node's path.
   */


  _parentNodePath(path) {
    let dir = (0, _path2.dirname)(path);

    if (this._isNonVarFile(path)) {
      dir = (0, _path2.dirname)(dir);
    }

    return dir.replace(/.inner$/, '');
  }
  /**
   * Returns `true` for all root node paths.
   * @param {string} path The path to check.
   * @return {boolean} If the node at *path* is a root node.
   */


  _isRootNodePath(path) {
    const name = (0, _path2.relative)(this._base, path); // MARK: Only works with compact mapping applied, update once configurable.
    // FIXME: Needs a more general solution.
    // eslint-disable-next-line max-len

    return /^(AGENT|SYSTEM|ObjectTypes.PROJECT|VariableTypes.PROJECT).\.(Object|ObjectType|VariableType)?.json$/.test(name);
  }
  /**
   * Stats the given paths.
   * @param {string[]} paths The paths to stat.
   * @return {Promise<void>} Resolved once finished.
   */


  _stat(paths) {
    return Promise.all(paths.map(path => stat(path).then(s => {
      if (s.isDirectory()) {
        this._isDir.add(path);

        if (this._path.split(path).length > 1 || // browse up to source node
        this._recursive && path.split(this._path).length > 1 // browse children if recursive
        ) {
            this._nextToBrowse.push(path);
          }
      } else if (s.isFile()) {
        if (this._isDefinitionFile(path)) {
          const parentPath = this._parentNodePath(path);

          if (this._isRootNodePath(path) || this._pushedNodes.has(parentPath)) {
            this._nextToRead.push(path);
          } else {
            this._waitingForParent[parentPath] = (this._waitingForParent[parentPath] || []).concat(path);
          }
        } // Got a regular / variable value file

      }
    })));
  }
  /**
   * Reads the given files.
   * @param {string[]} paths Reads the files at the given paths.
   * @return {Promise<void>} Resolved once finished.
   */


  _read(paths) {
    return Promise.all(paths.map(path => readFile(path).then(contents => {
      if (this._isDefinitionFile(path)) {
        this._discoveredNode({
          path,
          definitions: JSON.parse(contents.toString())
        });
      } else {
        const node = this._discoveredNodes.get(path);

        if (!node) {
          throw new Error(`Unknown node at ${path}`);
        }

        node._rawValue = contents;

        this._pushNode(node);
      }
    })));
  }
  /**
   * Processes the next itmems in all queues.
   * @return {Promise<void>} Resolved once finished.
   */


  async _processQueues() {
    if (this._isDestroyed) {
      return true;
    }

    await Promise.all([this._processQueue(this._nextToBrowse, this._browse.bind(this)), this._processQueue(this._nextToStat, this._stat.bind(this)), this._processQueue(this._nextToRead, this._read.bind(this))]);

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
  } // Dependency management

  /**
   * Invoced once a new node has been discovered. Queues it behind it's parents if needed, otherwise
   * marks it for reading.
   * @param {Object} options The discovered node.
   * @param {string} options.path The node's path.
   * @param {Object} options.definitions The node's definitions.
   */


  _discoveredNode({
    path: _path,
    definitions
  }) {
    let path = _path;
    let name = (0, _path2.basename)(path).slice(1).replace(/\.json$/, '');

    if (name.length >= 4 && _nodeclass.NodeClass[name]) {
      path = (0, _path2.dirname)(path);
      name = (0, _path2.basename)(path);
    }

    const dir = (0, _path2.dirname)(path);

    const parentPath = this._parentNodePath(path);

    const rel = (0, _path2.join)(dir, name);
    const node = new FileNode(Object.assign({
      name,
      parent: this._discoveredNodes.get(parentPath)
    }, definitions));
    node.relative = rel;

    this._discoveredNodes.set(rel, node);

    let dependencyCount = 0;

    if (!this._pushedNodes.has(parentPath) && !this._isRootNodePath(_path)) {
      throw new Error(`'${path}' was pushed before parent node`);
    }

    for (const [type, references] of node.references.entries()) {
      if (type !== _Node.ReferenceTypeIds.toParent) {
        for (const reference of references) {
          if (type !== _Node.ReferenceTypeIds.toParent && // parents are handled via _waitingForParent
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

    if (dependencyCount) {
      // has deps
      this._dependencies[node.nodeId] = dependencyCount;
    } else {
      this._readNodeValue(node);
    }
  }
  /**
   * Marks a variable node for reading or pushes it if non-var.
   * @param {FileNode} node The node to read the value of.
   */


  _readNodeValue(node) {
    if (node.nodeClass === _nodeclass.NodeClass.Variable && !this._isDir.has(node.relative)) {
      this._nextToRead.push(node.relative);
    } else {
      this._pushNode(node);
    }
  }
  /**
   * Pushes a node and queues it's dependents.
   * @param {FileNode} node The node to push.
   */


  _pushNode(node) {
    this._pushedNodes.add(node.relative);

    this._pushedNodes.add(node.nodeId);

    this.onNode(node); // FIXME: Only while debugging

    /*
    if (!node.parent && ![
      'AGENT',
      'SYSTEM',
      'VariableTypes.PROJECT',
      'ObjectTypes.PROJECT',
    ].includes(node.nodeId)) {
      throw new Error(`Node '${node.nodeId}' has no parent node`);
    }
    */

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
  /**
   * Destroys the browser.
   */


  async destroy() {
    this.stop();
    this._isDestroyed = true;
  }
  /**
   * Invoced to start the browser pushing nodes.
   */


  start() {
    this._isStopped = false;

    while (this._readNodes.length) {
      this.onNode(this._readNodes.shift());

      if (this._isStopped) {
        break;
      }
    }

    if (!this._readNodes.length && this._ended) {
      this.onEnd();
    }
  }
  /**
   * Prevents the browser to push nodes.
   */


  stop() {
    this._isStopped = true;
  }

}
/**
 * A stream writing {@link FileNode}s.
 */


exports.SourceBrowser = SourceBrowser;

class SourceStream extends _stream.Readable {
  /**
   * Creates a new steam.
   * @param {Object} options The options to use.
   * @see {SourceBrowser#constructor}
   */
  constructor(options) {
    super(Object.assign(options, {
      objectMode: true,
      highWaterMark: 10000
    }));
    /**
     * If the stream is destoryed.
     * @type {boolean}
     */

    this._isDestroyed = false;
    /**
     * The stream's file system browser.
     * @type {SourceBrowser}
     */

    this._browser = new SourceBrowser(options);

    this._browser.onNode = node => {
      if (!this.push(node)) {
        this._browser.stop();
      }
    };

    this._browser.onEnd = () => {
      this.push(null);
      this.destroy();
    };

    this._browser.onError = err => {
      if (this.isDestroyed) {
        return;
      }

      this.emit('error', err);
      this.destroy();
    };
  }
  /**
   * If the stream is destroyed.
   * @type {boolean}
   */


  get isDestroyed() {
    return this._isDestroyed;
  }
  /**
   * Starts the browser.
   */


  _read() {
    this._browser.start();
  }
  /**
   * Destoys the stream and it's browser.
   * @param {?Error} err The error that caused the destroy.
   * @param {function(err: ?Error)} callback Called once finished.
   */


  _destroy(err, callback) {
    this._isDestroyed = true;
    super.destroy(err, () => {
      this._browser.destroy().then(() => callback(err)).catch(destroyErr => callback(err || destroyErr));
    });
  }

}
/**
 * Returns a {@link SourceStream} for the given path.
 * @param {string} path The path to read from.
 * @param {Object} options Options passed to the {@link SourceStream}.
 * @return {SourceStream} The source stream.
 */


exports.SourceStream = SourceStream;

function src(path, options = {}) {
  const getAbsolute = rel => (0, _path2.isAbsolute)(rel) ? rel : (0, _path2.join)(process.cwd(), rel);

  return new SourceStream(Object.assign(options, {
    path: getAbsolute(path),
    base: getAbsolute(options.base || './src'),
    // FIXME: Take from config file
    recursive: options.recursive === undefined ? true : options.recursive
  }));
}
//# sourceMappingURL=src.js.map