import { Writable } from 'stream';
import { join } from 'path';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { outputFile, readJson } from 'fs-extra';
import Logger from 'gulplog';
import { encodeVariant } from '../coding';

/**
 * Relative path to the rename file.
 * @type {string}
 */
const renameConfigPath = './atscm/rename.json';

/**
 * The default name inserted into the rename file.
 * @type {string}
 */
const renameDefaultName = 'insert node name';

/**
 * A stream that writes {@link Node}s to the file system.
 */
export class WriteStream extends Writable {

  /**
   * Creates a new WriteStream.
   * @param {Object} options The options to use.
   * @param {string} options.path The path to write to **(required)**.
   * @param {string} options.base The base path to write to (defaults to *path*).
   */
  constructor(options) {
    if (!options.path) {
      throw new Error('Missing `path` option');
    }

    super(Object.assign({}, options, { objectMode: true, highWaterMark: 10000 }));

    /**
     * If the stream is destroyed.
     * @type {boolean}
     */
    this._isDestroyed = false;

    /**
     * The number of processed nodes.
     * @type {number}
     */
    this._processed = 0;

    /**
     * The number of written nodes.
     * @type {number}
     */
    this._written = 0;

    /**
     * The base to output to.
     * @type {string}
     */
    this._base = options.base || options.path;

    /**
     * The object stored in the *rename file* (usually at './atscm/rename.json')
     */
    this._renameConfig = {};

    /**
     * A promise that resolves once the *rename file* is loaded.
     * @type Promise<Object>
     */
    this._loadRenameConfig = readJson(renameConfigPath)
      .then(config => (this._renameConfig = config))
      .catch(() => Logger.debug('No rename config file loaded'));

    /**
     * A map of ids used for renaming.
     */
    this._idMap = new Map();

    /**
     * If writes should actually be performed. Set to `false` once id conflicts were discovered.
     */
    this._performWrites = true;

    this._discoveredIdConflicts = 0;
  }

  /**
   * If the stream is destroyed.
   * @type {boolean}
   */
  get isDestroyed() {
    return this._isDestroyed;
  }

  /**
   * Transverses the node tree to see if any parent node has an id conflict.
   * @param {ServerNode} node The processed node.
   * @return {boolean} `true` if a parent node has an id conflict.
   */
  _parentHasIdConflict(node) {
    let current = node.parent;

    while (current) {
      if (current._hasIdConflict) { return true; }
      current = current.parent;
    }

    return false;
  }

  /**
   * Writes a single node to disk.
   * @param {ServerNode} node The processed node.
   * @return {Promise<boolean>} Resolves once the node has been written, `true` indicates the node
   * has actually been written.
   */
  async _writeNode(node) {
    // TODO: Throw if node.name ends with '.inner'
    const dirPath = node.filePath;

    const writeOps = [];

    // Rename nodes specified in the rename config
    const rename = this._renameConfig[node.id.value];
    if (rename && rename !== renameDefaultName) {
      node.renameTo(rename);
      Logger.debug(`'${node.nodeId}' was renamed to '${rename}'`);

      Object.assign(node, { _renamed: true });
    }

    // Resolve invalid ids
    if (!node._renamed && node.nodeId !== node.id.value) {
      Logger.debug(`Resolved ID conflict: '${
        node.id.value}' should be renamed to '${node.nodeId}'`);
    }

    Object.assign(node, { specialId: node.id.value });

    if (node.name.match(/:/)) {
      const before = node.name;
      node.renameTo(node.name.replace(/:/g, '_'));
      Logger.debug(`Resolved ID conflict: '${before}' was renamed to safe name '${node.name}'`);
    }

    // Detect "duplicate" ids (as file names are case insensitive)
    const pathKey = dirPath.concat(node.fileName).join('/').toLowerCase();
    if (this._idMap.has(pathKey)) {
      if (this._parentHasIdConflict(node)) {
        Logger.debug(`ID conflict: Skipping '${node.nodeId}'`);
      } else {
        Logger.error(`ID conflict: '${node.nodeId}' conflicts with '${
          this._idMap.get(pathKey)
        }'`);

        this._discoveredIdConflicts++;

        const existingRename = this._renameConfig[node.nodeId];
        if (existingRename) {
          if (existingRename === renameDefaultName) {
            // eslint-disable-next-line max-len
            Logger.error(` - '${node.nodeId}' is present inside the rename file at './atscm/rename.json', but no name has been inserted yet.`);
          } else {
            // eslint-disable-next-line max-len
            Logger.error(` - The name for '${node.nodeId}' inside './atscm/rename.json' is not unique.`);
          }

          Logger.info(" - Edit the node's name and run 'atscm pull' again");
        } else {
          this._renameConfig[node.nodeId] = renameDefaultName;
          Logger.info(` - '${node.nodeId}' was added to the rename file at './atscm/rename.json'`);
          Logger.info("Edit it's name and run 'atscm pull' again.");
        }
      }

      Object.assign(node, { _hasIdConflict: true });
      this._performWrites = false;
    } else {
      this._idMap.set(pathKey, node.nodeId);
    }

    // Write definition file (if needed)
    if (node.hasUnresolvedMetadata) {
      const name = node.nodeClass === NodeClass.Variable ?
        `./.${node.fileName}.json` :
        `./${node.fileName}/.${node.nodeClass.key}.json`;

      if (this._performWrites) {
        writeOps.push(
          outputFile(join(this._base, dirPath.join('/'), name),
            JSON.stringify(node.metadata, null, '  '))
        );
      }
    }

    // Write value
    if (node.nodeClass === NodeClass.Variable) {
      if (node.value) {
        if (!node.value.noWrite) {
          if (this._performWrites) {
            writeOps.push(
              outputFile(
                join(this._base, dirPath.join('/'), node.fileName),
                encodeVariant(node.value))
            );
          }

          // Store child nodes as file.inner/...
          node.renameTo(`${node.name}.inner`);
        }
      } else {
        throw new Error('Missing value');
      }
    }

    return Promise.all(writeOps)
      .then(() => {
        this._processed++;
        this._written += writeOps.length;
      })
      .then(() => writeOps.length > 0);
  }

  /**
   * Writes a single node to the file system.
   * @param {Node} node The node to write.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error): void} callback Called once finished.
   */
  _write(node, enc, callback) {
    this._loadRenameConfig
      .then(() => this._writeNode(node))
      .then(() => callback())
      .catch(err => callback(err));
  }

  /**
   * Writes multiple nodes in parallel.
   * @param {Node[]} nodes The nodes to write.
   * @param {function(error: ?Error): void} callback Called once all nodes have been written.
   */
  _writev(nodes, callback) {
    if (this.isDestroyed) { return; }

    this._loadRenameConfig
      .then(() => Promise.all(nodes
        .map(({ chunk }) => this._writeNode(chunk)))
      )
      .then(() => callback())
      .catch(err => callback(err));
  }

  /**
   * Destroys the stream.
   * @param {?Error} err The error that caused the destroy.
   * @param {function(err: ?Error): void} callback Called once finished.
   */
  _destroy(err, callback) {
    this._isDestroyed = true;
    super._destroy(err, callback);
  }

  /**
   * Writes the updated rename config to disk.
   * @param {function(err: ?Error): void} callback Called once the rename file has been written.
   */
  _final(callback) {
    if (this._discoveredIdConflicts) {
      Logger.error(
        `Discovered ${this._discoveredIdConflicts} node id conflicts, results are incomplete.
 - Resolve all conflicts inside '${renameConfigPath}' and run 'atscm pull' again`);
      // FIXME: Insert link to node ide conflict manual here once 1.0.0 is released.
    }

    outputFile(renameConfigPath, JSON.stringify(this._renameConfig, null, '  '))
      .then(callback)
      .catch(callback);
  }

}

/**
 * Creates a new {@link WriteStream} to write to *path*.
 * @param {string} path The path to write to.
 */
export default function dest(path) {
  return new WriteStream({ path });
}
