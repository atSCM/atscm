"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isDefinitionFile = isDefinitionFile;
exports.default = src;
exports.SourceBrowser = exports.FileNode = void 0;

var _path = require("path");

var _fsExtra = require("fs-extra");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _variant = require("node-opcua/lib/datamodel/variant");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _pQueue = _interopRequireDefault(require("p-queue"));

var _Node = require("../model/Node");

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _coding = require("../coding");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * A node returned by the {@link SourceStream}.
 */
class FileNode extends _Node.SourceNode {
  /**
   * Creates a new node.
   * @param options The options to use.
   */
  constructor(_ref) {
    let {
      nodeClass,
      dataType,
      arrayType,
      references,
      nodeId
    } = _ref,
        options = _objectWithoutProperties(_ref, ["nodeClass", "dataType", "arrayType", "references", "nodeId"]);

    super(_objectSpread({}, options, {
      nodeClass: _nodeclass.NodeClass[nodeClass || 'Variable']
    }));

    _defineProperty(this, "_rawValue", void 0);

    _defineProperty(this, "valueSoFar", {});

    if (nodeId) {
      /**
       * The id stored in the definition file
       * @type {NodeId}
       */
      this.specialId = nodeId;
    }

    if (references) {
      Object.entries(references).forEach(([ref, ids]) => {
        const type = _Node.ReferenceTypeIds[ref] || parseInt(ref, 10);
        ids.forEach(id => {
          this.references.addReference(type, id);

          this._resolvedReferences.addReference(type, id);
        });
      });
    }

    if (dataType) {
      this.valueSoFar.dataType = _variant.DataType[dataType];
    }

    if (arrayType) {
      this.valueSoFar.arrayType = _variant.VariantArrayType[arrayType];
    }
  }

  setRawValue(value) {
    this._rawValue = value;
  }

  hasRawValue() {
    return !!this._rawValue;
  }
  /**
   * A node's raw value, decoded into a string.
   */


  get stringValue() {
    if (!this.hasRawValue()) {
      throw new Error('No value read yet. Ensure to call #setRawValue');
    }

    return this._rawValue.toString();
  }
  /** The node's value (may be incomplete, use {@link FileNode#value} to ensure). */


  valueIsComplete() {
    return this.valueSoFar.value !== undefined;
  }
  /**
   * A node's {@link node-opcua~Variant} value.
   */


  get variantValue() {
    const value = this.valueSoFar;

    if (!this.valueIsComplete()) {
      if (!value.dataType) {
        throw new Error(`${this.nodeId} has no data type`);
      }

      if (!value.arrayType) {
        throw new Error(`${this.nodeId} has no array type`);
      }

      if (this.hasRawValue()) {
        value.value = (0, _coding.decodeVariant)(this._rawValue, value);
      }
    }

    return this.valueSoFar;
  }

  get value() {
    return this.variantValue;
  }

} // Helpers

/**
 * Returns `true` for definition file paths.
 * @param path The path to check.
 * @return If the file at path is a definition file.
 */


exports.FileNode = FileNode;

function isDefinitionFile(path) {
  return Boolean((0, _path.basename)(path).match(/^\..*\.json$/));
}
/**
 * Matches container files.
 */


const containerFileRegexp = /^\.((Object|Variable)(Type)?|Method|View|(Reference|Data)Type)\.json$/;

/**
 * Browses the local file system for nodes.
 */
class SourceBrowser {
  /** The queue processing incoming paths / nodes. @type {p-queue~PQueue} */

  /** A callback called with every discovered node. */

  /** A callback deciding if a node file should be read. */

  /** The pushed node's ids */

  /** The pushed node's paths */

  /** Stores how queued nodes depend on each other */
  // eslint-disable-next-line no-spaced-func

  /**
   * Sets up a new browser.
   * @param options The options to apply.
   * @param options.handleNode A callback called with every discovered node.
   * @param options.readNodeFile A callback deciding if a node file should be read.
   */
  constructor({
    handleNode,
    readNodeFile
  }) {
    _defineProperty(this, "_queue", void 0);

    _defineProperty(this, "_nodeHandler", void 0);

    _defineProperty(this, "_readNodeFile", void 0);

    _defineProperty(this, "_pushed", new Set());

    _defineProperty(this, "_pushedPath", new Set());

    _defineProperty(this, "_dependingOn", new Map());

    _defineProperty(this, "_reject", void 0);

    this._queue = new _pQueue.default({
      concurrency: 250
    });
    this._nodeHandler = handleNode;
    this._readNodeFile = readNodeFile;
  }
  /**
   * A function to be called once an error occurres during parallel processing.
   * @param error The error to exit with.
   */


  /**
   * Starts the browser at the given path.
   * @param path The path to start browsing at.
   * @param options Passed directly to {@link SourceBrowser#processPath}.
   * @return Fulfilled once browsing is complete.
   */
  async browse(path, options = {}) {
    let processError;
    const done = new Promise((resolve, reject) => {
      this._reject = err => {
        if (processError) {
          // Multiple errors occured. In most cases this means, that the server connection was
          // closed after the first error.
          _gulplog.default.debug('Additional error', err);

          return;
        }

        processError = err;

        this._queue.pause();

        this._queue.clear();

        reject(err);
      }; // write initial path


      this.processPath(_objectSpread({
        path
      }, options));

      this._queue.onIdle().then(() => {
        if (processError) {
          return;
        }

        if (this._dependingOn.size) {
          reject(new Error(`Some nodes are still waiting for dependencies
  Missing nodes: ${Array.from(this._dependingOn.keys()).join(', ')}
  - Pull these nodes or add them to the ignored ones`));
        }

        resolve();
      });
    });
    return done;
  }
  /**
   * Enqueues a {@link SourceBrowser#_processPath} call with the given options.
   * @param options Passed directly to {@link SourceBrowser#_processPath}.
   */


  processPath(options) {
    return this._queue.add(() => this._processPath(options).catch(this._reject));
  }
  /**
   * Can be called by transformers to read this path before finishing it's parent nodes.
   * @param {Object} options Passed directly to {@link SourceBrowser#_processPath}.
   * @param {string} options.path The path to read.
   */


  readNode({
    path
  }) {
    return this._processPath({
      path,
      push: false
    }); // NOTE: If `push` is true, the browser always returns a node.
  }
  /**
   * Where the real browsing happens: Stats the given path, discovering new node definition files,
   * if any and finally pushes discovered nodes to {@link SourceBrowser#_processNode}.
   * @param {Object} options The options to use.
   */


  async _processPath({
    path,
    parent,
    children,
    push = true,
    singleNode = false
  }) {
    const s = await (0, _fsExtra.stat)(path);

    if (s.isDirectory()) {
      let container;
      const nextChildren = (await (0, _fsExtra.readdir)(path)).reduce((nodes, p) => {
        const node = {
          name: p,
          path: (0, _path.join)(path, p),
          push
        };

        if (p.match(containerFileRegexp)) {
          container = node;
          return nodes;
        }

        let parts;
        const noProcessingNeeded = nodes.find(current => {
          const n = current.name;

          if (n === `.${p}.json`) {
            return true;
          } // Skip files with definitions already present


          const [raw, rest] = parts || (parts = p.split('.inner'));

          if (rest === '' && (n === raw || n === `.${raw}.json`)) {
            // Got an *.inner directory
            // eslint-disable-next-line no-param-reassign
            current.children = (current.children || []).concat(node);
            return true;
          }

          return false;
        });
        return noProcessingNeeded ? nodes : nodes.concat(node);
      }, []);

      if (container) {
        return this._processPath(Object.assign(container, {
          children: nextChildren,
          parent
        }));
      } else if (singleNode) {
        _gulplog.default.debug(`Pushing parent at ${path}`);

        return this._processPath({
          path: (0, _path.join)(path, '../'),
          parent,
          children,
          push
        });
      }

      const inheritParent = path.endsWith('.inner');
      nextChildren.forEach(node => {
        if (inheritParent) {
          // eslint-disable-next-line no-param-reassign
          node.parent = parent;
        }

        this.processPath(node);
      });
    } else if (s.isFile()) {
      if (!isDefinitionFile(path)) {
        // FIXME: Browse parent here for watch task / Variable source node
        // (e.g. AGENT/DISPLAYS/Default.display/Default.js changed)
        if (singleNode) {
          _gulplog.default.debug(`Pushing parent at ${path}`);

          return this._processPath({
            path: (0, _path.join)(path, '../'),
            parent,
            children,
            push,
            singleNode
          });
        }

        _gulplog.default.warn(`Not a definition file at ${path}`);

        return Promise.resolve();
      }

      let name = (0, _path.basename)(path, '.json').slice(1);

      if (name.length >= 4 && _nodeclass.NodeClass[name]) {
        name = (0, _path.basename)((0, _path.dirname)(path));
      }

      if (this._pushedPath.has(path)) {
        // throw new Error('Double-handled node ' + path);
        return Promise.resolve();
      }

      const dir = (0, _path.dirname)(path);
      const rel = (0, _path.join)(dir, name);
      const node = Object.assign(new FileNode(_objectSpread({
        name,
        parent
      }, (await (0, _fsExtra.readJSON)(path)))), {
        push,
        // FIXME: Remove?
        children,
        relative: rel,
        definitionPath: path
      });
      return this._processNode(node);
    }

    return Promise.resolve();
  }
  /**
   * Handles a node's dependencies and calls {@link SourceBrowser#_pushNode} once it's ready.
   * @param node A discovered node.
   */


  _processNode(node) {
    // Build dependency map
    if (!node.waitingFor) {
      const deps = Array.from(node.references).reduce((result, [, ids]) => result.concat(Array.from(ids).filter(id => {
        if (typeof id === 'number') {
          // OPC-UA node
          return false;
        }

        return !this._pushed.has(id) && !_ProjectConfig.default.isExternal(id);
      })), []); // eslint-disable-next-line no-param-reassign

      node.waitingFor = new Set(deps);
      deps.forEach(d => {
        this._dependingOn.set(d, (this._dependingOn.get(d) || []).concat(node));
      });
    }

    if (!node.waitingFor.size) {
      return this._pushNode(node);
    }

    return Promise.resolve();
  }
  /**
   * Reads a node's value file (if it's a variable) and calls {@link SourceBrowser#_nodeHandler}
   * with it, finishing the node's processing and promoting it's dependents, if any.
   * @param node A discovered node.
   * @return The node, once it's fully processed.
   */


  async _pushNode(node) {
    // Read node value
    if (node.nodeClass === _nodeclass.NodeClass.Variable && this._readNodeFile(node)) {
      // eslint-disable-next-line no-param-reassign
      await (0, _fsExtra.readFile)(node.relative).then(value => node.setRawValue(value)).catch(err => {
        if (err.code === 'EISDIR') {
          return;
        }

        throw new Error(`${err.code}: Error reading ${node.relative}`);
      });
    }

    return this._nodeHandler(node).then(() => {
      // Handle children
      if (node.children) {
        node.children.forEach(child => {
          // eslint-disable-next-line no-param-reassign
          child.parent = node;
          this.processPath(child);
        });
      } // Handle dependencies


      const depending = this._dependingOn.get(node.nodeId);

      if (depending) {
        depending.forEach(dep => {
          dep.waitingFor.delete(node.nodeId);

          if (!dep.waitingFor.size) {
            // All dependencies resolved
            return this._pushNode(dep);
          } // Still waiting


          return _gulplog.default.debug('Still waiting', dep.nodeId, Array.from(dep.waitingFor));
        });
      } // eslint-disable-next-line no-param-reassign


      delete node.waitingFor;

      this._dependingOn.delete(node.nodeId);

      this._pushed.add(node.nodeId); // Mark as pushed


      this._pushedPath.add(node.definitionPath);

      return node;
    });
  }

}
/**
 * Starts a new source browser at the given path.
 * @param path The path to start browsing with.
 * @param options Passed directly to {@link SourceBrowser#constructor}.
 * @return A promise resolved once browsing is finished, with an addional *browser* property holding
 * the SourceBrowser instance created.
 */


exports.SourceBrowser = SourceBrowser;

function src(path, options) {
  const browser = new SourceBrowser(options);
  return Object.assign(browser.browse(path, options), {
    browser
  });
} // Option types

/** A file node while being processed by a source browser */
//# sourceMappingURL=src.js.map