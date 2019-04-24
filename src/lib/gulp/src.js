import { join, basename, dirname } from 'path';
import { readdir, stat, readFile, readJSON } from 'fs-extra';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import Logger from 'gulplog';
import PromiseQueue from 'p-queue';
import { SourceNode, ReferenceTypeIds } from '../model/Node';
import ProjectConfig from '../../config/ProjectConfig';
import { decodeVariant } from '../coding';

/**
 * A node returned by the {@link SourceStream}.
 */
export class FileNode extends SourceNode {

  /**
   * Creates a new node.
   * @param {Object} options The options to use.
   */
  constructor({ name, parent, nodeClass, nodeId, references, dataType, arrayType }) {
    super({ name, parent, nodeClass });

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
      this.nodeClass = NodeClass[nodeClass];
    } else {
      this.nodeClass = NodeClass.Variable;
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
      if (!value.arrayType) {
        throw new Error(`${this.nodeId} has no array type`);
      }
      value.value = decodeVariant(this._rawValue, value);
    }

    return value;
  }

}

// Helpers
export function isDefinitionFile(path) {
  return basename(path).match(/^\..*\.json$/);
}

const containerFileRegexp = /^\.((Object|Variable)(Type)?|Method|View|(Reference|Data)Type)\.json$/;

const hierarchicalReferencesTypeNames = new Set([
  'HasChild',
  'Aggregates',
  'HasComponent',
  'HasOrderedComponent',
  'HasHistoricalConfiguration',
  'HasProperty',
  'HasSubtype',
  'HasEventSource',
  'HasNotifier',
  'Organizes',
]);

class SourceBrowser {

  constructor({ handleNode, readNodeFile }) {
    this._queue = new PromiseQueue({
      concurrency: 250,
    });

    this._nodeHandler = handleNode;
    this._readNodeFile = readNodeFile;

    this._pushed = new Set();
    this._pushedPath = new Set();
    this._dependingOn = new Map();
  }

  async browse(path, options = {}) {
    let processError = null;

    const done = new Promise((resolve, reject) => {
      this._reject = err => {
        if (processError) {
          // Multiple errors occured. In most cases this means, that the server connection was
          // closed after the first error.
          Logger.debug('Additional error', err);
          return;
        }

        processError = err;
        this._queue.pause();
        this._queue.clear();

        reject(err);
      };

      // write initial path
      this.processPath({ path, ...options });

      this._queue.onIdle().then(() => {
        if (processError) { return; }

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

  processPath(options) {
    return this._queue.add(() => this._processPath(options).catch(this._reject));
  }

  readNode({ path, tree }) {
    return this._processPath({
      path,
      tree,
      push: false,
    });
  }

  async _processPath({ path, parent, children, push = true, singleNode = false }) {
    const s = await stat(path);

    if (s.isDirectory()) {
      let container;
      const nextChildren = (await readdir(path))
        .reduce((nodes, p) => {
          const node = {
            name: p,
            path: join(path, p),
            push,
          };

          if (p.match(containerFileRegexp)) {
            container = node;

            return nodes;
          }

          let parts;
          const noProcessingNeeded = nodes.find(current => {
            const n = current.name;
            if (n === `.${p}.json`) { return true; } // Skip files with definitions already present

            const [raw, rest] = parts || (parts = p.split('.inner'));

            if (rest === '' && (n === raw || n === `.${raw}.json`)) { // Got an *.inner directory
              // eslint-disable-next-line no-param-reassign
              current.children = (current.children || []).concat(node);
              return true;
            }

            return false;
          });

          return noProcessingNeeded ? nodes : nodes.concat(node);
        }, []);

      if (container) {
        return this._processPath(Object.assign(container, { children: nextChildren, parent }));
      } else if (singleNode) {
        Logger.debug(`Pushing parent at ${path}`);
        return this._processPath({ path: join(path, '../'), parent, children, push });
      }

      nextChildren.forEach(node => this.processPath(node));
    } else if (s.isFile()) {
      if (!isDefinitionFile(path)) {
        // FIXME: Browse parent here for watch task / Variable source node
        // (e.g. AGENT/DISPLAYS/Default.display/Default.js changed)

        if (singleNode) {
          Logger.debug(`Pushing parent at ${path}`);
          return this._processPath({ path: join(path, '../'), parent, children, push, singleNode });
        }

        Logger.warn(`Not a definition file at ${path}`);
        return Promise.resolve();
      }

      let name = basename(path, '.json').slice(1);
      if (name.length >= 4 && NodeClass[name]) {
        name = basename(dirname(path));
      }

      if (this._pushedPath.has(path)) {
        // throw new Error('Double-handled node ' + path);
        return Promise.resolve();
      }

      const dir = dirname(path);
      const rel = join(dir, name);
      const node = new FileNode({
        name,
        path, // FIXME: Remove, add as #relative
        parent,
        ...await readJSON(path),
      });

      node.push = push;
      node.children = children;
      node.relative = rel;
      node.definitionPath = path;

      return this._processNode(node);
    }

    return Promise.resolve();
  }

  _processNode(node) {
    // Build dependency map
    if (!node.waitingFor) {
      const deps = Array.from(node.references)
        .filter(([key]) => key !== 'toParent' && !hierarchicalReferencesTypeNames.has(key))
        .reduce((result, [, ids]) => result
          .concat(Array.from(ids).filter(id => !(this._pushed.has(id)))), [])
        .filter(id => {
          if (typeof id === 'number') { // OPC-UA node
            return false;
          }

          return !ProjectConfig.isExternal(id);
        });
      // eslint-disable-next-line no-param-reassign
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

  async _pushNode(node) {
    // Read node value
    if (node.nodeClass === NodeClass.Variable && this._readNodeFile(node)) {
      // eslint-disable-next-line no-param-reassign
      node._rawValue = await readFile(node.relative)
        .catch(err => {
          if (err.code === 'EISDIR') { return; }
          throw new Error(`${err.code}: Error reading ${node.path}`);
        });
    }

    return this._nodeHandler(node)
      .then(() => {
        // Handle children
        if (node.children) {
          node.children.forEach(child => {
            // eslint-disable-next-line no-param-reassign
            child.parent = node;
            this.processPath(child);
          });
        }

        // Handle dependencies
        const depending = this._dependingOn.get(node.nodeId);
        if (depending) {
          depending.forEach(dep => {
            dep.waitingFor.delete(node.nodeId);

            if (!dep.waitingFor.size) {
              // All dependencies resolved
              return this._pushNode(Object.assign(dep, {
                tree: {
                  ...dep.tree,
                  parent: node,
                },
              }));
            }

            // Still waiting
            return Logger.debug('Still waiting', dep.nodeId, Array.from(dep.waitingFor));
          });
        }

        // eslint-disable-next-line no-param-reassign
        delete node.waitingFor;
        this._dependingOn.delete(node.nodeId);
        this._pushed.add(node.nodeId);

        // Mark as pushed
        this._pushedPath.add(node.definitionPath);

        return node;
      });
  }

}

export default function src(path, options = {}) {
  const browser = new SourceBrowser(options);

  return Object.assign(browser.browse(path, options), { browser });
}
