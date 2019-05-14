import { join, basename, dirname } from 'path';
import { readdir, stat, readFile, readJSON } from 'fs-extra';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { DataType, VariantArrayType, Variant } from 'node-opcua/lib/datamodel/variant';
import { KeyOf } from 'node-opcua/lib/misc/enum.js';
import Logger from 'gulplog';
import PromiseQueue from 'p-queue';
import {
  SourceNode, ReferenceTypeIds, NodeOptions, NodeDefinition,
} from '../model/Node';
import ProjectConfig from '../../config/ProjectConfig';
import { decodeVariant } from '../coding';
import { Omit } from '../helpers/types';

type FileNodeOptions = Omit<NodeOptions, 'nodeClass'> & NodeDefinition;

/**
 * A node returned by the {@link SourceStream}.
 */
export class FileNode extends SourceNode {

  /**
   * Creates a new node.
   * @param options The options to use.
   */
  public constructor({
    nodeClass, dataType, arrayType, references, nodeId,
    ...options
  }: FileNodeOptions) {
    super({
      ...options,
      nodeClass: NodeClass[nodeClass || 'Variable'],
    });

    if (nodeId) {
      /**
       * The id stored in the definition file
       * @type {NodeId}
      */
      this.specialId = nodeId;
    }

    if (references) {
      (Object.entries(references) as ([keyof typeof ReferenceTypeIds, (string | number)[]])[])
        .forEach(([ref, ids]) => {
          const type = ReferenceTypeIds[ref];

          ids.forEach(id => {
            this.references.addReference(type, id);
            this._resolvedReferences.addReference(type, id);
          });
        });
    }

    if (dataType) {
      this.valueSoFar.dataType = DataType[dataType];
    }

    if (arrayType) {
      this.valueSoFar.arrayType = VariantArrayType[arrayType];
    }
  }

  protected _rawValue?: Buffer;

  public setRawValue(value: Buffer): void {
    this._rawValue = value;
  }

  private hasRawValue(): this is { _rawValue: Buffer } {
    return !!this._rawValue;
  }

  /**
   * A node's raw value, decoded into a string.
   */
  public get stringValue(): string {
    if (!this.hasRawValue()) { throw new Error('No value read yet. Ensure to call #setRawValue'); }

    return this._rawValue.toString();
  }

  /** The node's value (may be incomplete, use {@link FileNode#value} to ensure). */
  public valueSoFar: Partial<Variant> = {};

  private valueIsComplete(): this is { valueSoFar: Variant } {
    return this.valueSoFar.value !== undefined;
  }

  /**
   * A node's {@link node-opcua~Variant} value.
   */
  public get variantValue(): Variant {
    const value = this.valueSoFar;

    if (!this.valueIsComplete()) {
      if (!value.dataType) {
        throw new Error(`${this.nodeId} has no data type`);
      }
      if (!value.arrayType) {
        throw new Error(`${this.nodeId} has no array type`);
      }
      if (this.hasRawValue()) {
        value.value = decodeVariant(this._rawValue, value);
      }
    }

    return (this.valueSoFar as Variant);
  }

  public get value(): Variant {
    return this.variantValue;
  }

}

// Helpers
/**
 * Returns `true` for definition file paths.
 * @param path The path to check.
 * @return If the file at path is a definition file.
 */
export function isDefinitionFile(path: string): boolean {
  return Boolean(basename(path).match(/^\..*\.json$/));
}

/**
 * Matches container files.
 */
const containerFileRegexp = /^\.((Object|Variable)(Type)?|Method|View|(Reference|Data)Type)\.json$/;

type NodeHandler<R = void> = (node: FileNode) => R;

interface SourceBrowserOptions {
  handleNode: NodeHandler<Promise<void>>;
  readNodeFile: NodeHandler<boolean>;
}

/**
 * Browses the local file system for nodes.
 */
export class SourceBrowser {

  /** The queue processing incoming paths / nodes. @type {p-queue~PQueue} */
  private _queue: PromiseQueue;

  /** A callback called with every discovered node. */
  private _nodeHandler: NodeHandler<Promise<void>>;
  /** A callback deciding if a node file should be read. */
  private _readNodeFile: NodeHandler<boolean>;

  /** The pushed node's ids */
  private _pushed = new Set<string>();
  /** The pushed node's paths */
  private _pushedPath = new Set<string>();
  /** Stores how queued nodes depend on each other */
  // eslint-disable-next-line no-spaced-func
  private _dependingOn = new Map<string, (BrowsedFileNode & { waitingFor: Set<string> })[]>();

  /**
   * Sets up a new browser.
   * @param options The options to apply.
   * @param options.handleNode A callback called with every discovered node.
   * @param options.readNodeFile A callback deciding if a node file should be read.
   */
  public constructor({ handleNode, readNodeFile }: SourceBrowserOptions) {
    this._queue = new PromiseQueue({
      concurrency: 250,
    });

    this._nodeHandler = handleNode;
    this._readNodeFile = readNodeFile;
  }

  /**
   * A function to be called once an error occurres during parallel processing.
   * @param error The error to exit with.
   */
  private _reject!: (error: Error) => void;

  /**
   * Starts the browser at the given path.
   * @param path The path to start browsing at.
   * @param options Passed directly to {@link SourceBrowser#processPath}.
   * @return Fulfilled once browsing is complete.
   */
  public async browse(path: string, options = {}): Promise<void> {
    let processError: Error;

    const done = new Promise<void>((resolve, reject) => {
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

  /**
   * Enqueues a {@link SourceBrowser#_processPath} call with the given options.
   * @param options Passed directly to {@link SourceBrowser#_processPath}.
   */
  public processPath(options: ProcessPathOptions): Promise<FileNode | void> {
    return this._queue.add(() => this._processPath(options).catch(this._reject));
  }

  /**
   * Can be called by transformers to read this path before finishing it's parent nodes.
   * @param {Object} options Passed directly to {@link SourceBrowser#_processPath}.
   * @param {string} options.path The path to read.
   */
  public readNode({ path }: { path: string }): Promise<FileNode> {
    return this._processPath({
      path,
      push: false,
    }) as Promise<FileNode>; // NOTE: If `push` is true, the browser always returns a node.
  }

  /**
   * Where the real browsing happens: Stats the given path, discovering new node definition files,
   * if any and finally pushes discovered nodes to {@link SourceBrowser#_processNode}.
   * @param {Object} options The options to use.
   */
  private async _processPath({
    path, parent, children,
    push = true, singleNode = false,
  }: ProcessPathOptions): Promise<void | FileNode> {
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

          let parts: string[];
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
        }, [] as DiscoveredNodeFile[]);

      if (container) {
        return this._processPath(Object.assign(container, { children: nextChildren, parent }));
      } else if (singleNode) {
        Logger.debug(`Pushing parent at ${path}`);
        return this._processPath({ path: join(path, '../'), parent, children, push });
      }

      const inheritParent = path.endsWith('.inner');
      nextChildren.forEach(node => {
        // eslint-disable-next-line no-param-reassign
        if (inheritParent) { node.parent = parent; }
        this.processPath(node);
      });
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
      if (name.length >= 4 && NodeClass[name as KeyOf<typeof NodeClass>]) {
        name = basename(dirname(path));
      }

      if (this._pushedPath.has(path)) {
        // throw new Error('Double-handled node ' + path);
        return Promise.resolve();
      }

      const dir = dirname(path);
      const rel = join(dir, name);
      const node: BrowsedFileNode = Object.assign(new FileNode({
        name,
        parent,
        ...(await readJSON(path) as NodeDefinition),
      }), {
        push, // FIXME: Remove?
        children,
        relative: rel,
        definitionPath: path,
      });

      return this._processNode(node);
    }

    return Promise.resolve();
  }

  /**
   * Handles a node's dependencies and calls {@link SourceBrowser#_pushNode} once it's ready.
   * @param node A discovered node.
   */
  private _processNode(node: BrowsedFileNode): Promise<void | FileNode> {
    // Build dependency map
    if (!node.waitingFor) {
      const deps = Array.from(node.references)
        .reduce((result, [, ids]) => result
          .concat(Array.from(ids)
            .filter(id => {
              if (typeof id === 'number') { // OPC-UA node
                return false;
              }

              return !(this._pushed.has(id)) && !ProjectConfig.isExternal(id);
            }) as string[]),
        [] as string[]);
      // eslint-disable-next-line no-param-reassign
      node.waitingFor = new Set(deps);
      deps.forEach(d => {
        this._dependingOn.set(d, (this._dependingOn.get(d) || [])
          .concat(node as BrowsedFileNode & { waitingFor: Set<string> }));
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
  private async _pushNode(node: BrowsedFileNode): Promise<FileNode> {
    // Read node value
    if (node.nodeClass === NodeClass.Variable && this._readNodeFile(node)) {
      // eslint-disable-next-line no-param-reassign
      await readFile(node.relative)
        .then(value => node.setRawValue(value))
        .catch(err => {
          if (err.code === 'EISDIR') { return; }
          throw new Error(`${err.code}: Error reading ${node.relative}`);
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
              return this._pushNode(dep);
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

/**
 * Starts a new source browser at the given path.
 * @param path The path to start browsing with.
 * @param options Passed directly to {@link SourceBrowser#constructor}.
 * @return A promise resolved once browsing is finished, with an addional *browser* property holding
 * the SourceBrowser instance created.
 */
export default function src(path: string, options: SourceBrowserOptions): Promise<void> & {
  browser: SourceBrowser;
} {
  const browser = new SourceBrowser(options);

  return Object.assign(browser.browse(path, options), { browser });
}

// Option types

/** A file node while being processed by a source browser */
type BrowsedFileNode = FileNode & {
  waitingFor?: Set<string>;
  children?: DiscoveredNodeFile[];
  relative: string;
  definitionPath: string;
}

interface DiscoveredNodeFile {
  path: string;
  name: string;
  push: boolean;
  parent?: FileNode;
  children?: DiscoveredNodeFile[];
}

type ProcessPathOptions = Partial<DiscoveredNodeFile> & {
  path: string;
  singleNode?: boolean;
}
