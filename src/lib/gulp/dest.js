import { Writable } from 'stream';
import { join } from 'path';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { outputFile } from 'fs-extra';
import Logger from 'gulplog';
import { encodeVariant } from '../coding';

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
  }

  /**
   * If the stream is destroyed.
   * @type {boolean}
   */
  get isDestroyed() {
    return this._isDestroyed;
  }

  /**
   * Writes a single node to the file system.
   * @param {Node} node The node to write.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error): void} callback Called once finished.
   */
  _write(node, enc, callback) {
    // TODO: Throw if node.name ends with '.inner'
    const dirPath = node.filePath;

    const writeOps = [];

    if (node.nodeId !== node.id.value) {
      Logger.info(`Resolved ID conflict: '${node.id.value}' should be renamed to '${node.nodeId}'`);

      Object.assign(node, { specialId: node.id.value });
    }

    // Write definition file (if needed)
    if (node.hasUnresolvedMetadata) {
      const name = node.nodeClass === NodeClass.Variable ?
        `./.${node.fileName}.json` :
        `./${node.fileName}/.${node.nodeClass.key}.json`;

      writeOps.push(
        outputFile(join(this._base, dirPath.join('/'), name),
          JSON.stringify(node.metadata, null, '  '))
      );
    }

    // Write value
    if (node.nodeClass === NodeClass.Variable) {
      if (node.value) {
        if (!node.value.noWrite) {
          writeOps.push(
            outputFile(
              join(this._base, dirPath.join('/'), node.fileName),
              encodeVariant(node.value))
          );

          // Store child nodes as file.inner/...
          node.renameTo(`${node.name}.inner`);
        }
      } else {
        throw new Error('Missing value');
      }
    }

    Promise.all(writeOps)
      .then(() => callback())
      .catch(err => callback(err))
      .then(() => {
        this._processed++;
        this._written += writeOps.length;
      });
  }

  /**
   * Writes multiple nodes in parallel.
   * @param {Node[]} nodes The nodes to write.
   * @param {function(error: ?Error): void} callback Called once all nodes have been written.
   */
  _writev(nodes, callback) {
    if (this.isDestroyed) { return; }

    Promise.all(nodes.map(({ chunk, encoding }) => new Promise((resolve, reject) => {
      this._write(chunk, encoding, err => {
        if (err) { return reject(err); }
        return resolve();
      });
    })))
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

}

/**
 * Creates a new {@link WriteStream} to write to *path*.
 * @param {string} path The path to write to.
 */
export default function dest(path) {
  return new WriteStream({ path });
}
