import { Readable } from 'stream';
import Logger from 'gulplog';
import Project from '../../config/ProjectConfig';
import NodeBrowser from './NodeBrowser';

/**
 * A stream of server nodes.
 */
export default class NodeStream extends Readable {

  /**
   * Creates new node stream.
   * @param {NodeId[]} nodesToBrowse The nodes to browse.
   * @param {Object} [options] The options to use.
   * @param {boolean} [options.recursive] If the stream should recurse child nodes.
   * @param {NodeId[]} [options.ignoreNodes] The nodes to ignore.
   */
  constructor(nodesToBrowse, options = {}) {
    if (!nodesToBrowse || !(nodesToBrowse instanceof Array) || nodesToBrowse.length === 0) {
      throw new Error('nodesToBrowse is required');
    }

    if (options && options.ignoreNodes && !(options.ignoreNodes instanceof Array)) {
      throw new Error('ignoreNodes must be an array of node ids');
    }

    super(Object.assign({}, options, { objectMode: true }));

    // Handle options
    /**
     * If the discovered nodes should be browsed as well.
     * @type {Boolean}
     */
    this.recursive = true;
    if (options.recursive !== undefined) {
      this.recursive = options.recursive;
    }

    let ignoreNodes = Project.ignoreNodes;
    if (options.ignoreNodes !== undefined) {
      ignoreNodes = options.ignoreNodes;
    }

    /**
     * The timestamp when the stream started.
     * @type {number}
     */
    this._start = Date.now();

    const nodes = nodesToBrowse.filter(nodeId => {
      // FIXME: Move to node browser and implement
      const ignored = false && this.isIgnored({ nodeId });

      if (ignored) {
        Logger.warn(`${nodeId} is set to be browsed, but ignored.`);
        Logger.info(` - Remove ${nodeId} from Atviseproject#nodes if this is intentionally.`);
      }

      return !ignored;
    });

    if (!nodes.length) {
      throw new Error('Nothing to browse');
    }

    /**
     * If the stream is destroyed.
     * @type {boolean}
     */
    this._isDestroyed = false;

    // Write nodes to read

    /**
     * The stream's browser
     * @type {NodeBrowser}
     */
    this._browser = new NodeBrowser({
      nodes,
      ignoreNodes,
      recursive: options.recursive === undefined ? true : options.recursive,
    });

    this._browser.onNode = node => {
      if (node.nodeId.match(/\s$/)) {
        Logger.warn(`Node '${node.nodeId}' has trailing spaces in it's name.`);
        Logger.info(' - Rename it to prevent errors on windows.');
      }
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

  /**
   * If the stream is destoyed.
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
   * Destroys the stream.
   * @param {?Error} err The error that caused the destroy.
   * @param {function(err: ?Error): void} callback Called once finished.
   */
  _destroy(err, callback) {
    this._isDestroyed = true;

    super.destroy(err, () => {
      this._browser.destroy()
        .then(() => callback(err))
        .catch(destroyErr => callback(err || destroyErr));
    });
  }

  /**
   * The number of processed nodes.
   * @type {number}
   */
  get processed() {
    return this._browser._pushed.size;
  }

  /**
   * The number of processed chunks per second.
   * @type {number}
   */
  get opsPerSecond() {
    return (this.processed / ((Date.now() - this._start) / 1000)) || 0;
  }

}
