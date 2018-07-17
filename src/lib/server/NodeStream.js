import { Readable } from 'stream';
import BrowseService from 'node-opcua/lib/services/browse_service';
import Logger from 'gulplog';
import Project from '../../config/ProjectConfig';
import NodeBrowser from './NodeBrowser';

export default class NodeStream extends Readable {

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

    this._isDestroyed = false;

    // Write nodes to read
    this._browser = new NodeBrowser({ nodes, ignoreNodes });

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
