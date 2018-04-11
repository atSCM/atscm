import Logger from 'gulplog';
import QueueStream from './QueueStream';

/**
 * A stream of {@link AtviseFile}s that ensures the chunks are processed respecting the parent-child
 * relations between nodes.
 * @type {Object}
 */
export default class TreeStream extends QueueStream {

  /**
   * Creates a new stream.
   * @param {Object} [options={}] The options passed to the underlying {@link QueueStream}.
   */
  constructor(options = {}) {
    super(options);

    /**
     * A set of nodes currently handled.
     * @type {Set}
     */
    this._nodeIdsProcessing = new Set();

    /**
     * Files stored against the nodes they are queued behind to respect the node tree.
     * @type {Object}
     */
    this._waitingForParent = {};

    this.on('processed-chunk', ({ nodeId }, error) => {
      const id = nodeId.toString();
      const waiting = this._waitingForParent[id];

      if (waiting) {
        if (error) {
          Logger.warn(`Skipping ${waiting.length} child nodes`);
        } else {
          waiting.forEach(chunk => {
            super._enqueueChunk(chunk);
          });
        }

        delete this._waitingForParent[id];
      }

      this._nodeIdsProcessing.delete(id);
    });
  }

  /**
   * Enqueues a new chunk.
   * @param {AtviseFile} file The file to enqueue for processing.
   */
  _enqueueChunk(file) {
    const { nodeId } = file;

    this._nodeIdsProcessing.add(nodeId.toString());

    const parentProcessing = this._nodeIdsProcessing.has(nodeId.parent.toString());

    if (parentProcessing) {
      const key = nodeId.parent.toString();

      if (!this._waitingForParent[key]) {
        this._waitingForParent[key] = [file];
      } else {
        this._waitingForParent[key].push(file);
      }
    } else {
      // Chunk can be enqueued safely
      super._enqueueChunk(file);
    }
  }

}
