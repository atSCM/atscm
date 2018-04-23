'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _QueueStream = require('./QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream of {@link AtviseFile}s that ensures the chunks are processed respecting the parent-child
 * relations between nodes.
 * @type {Object}
 */
class TreeStream extends _QueueStream2.default {

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
          _gulplog2.default.warn(`Skipping ${waiting.length} child nodes`);
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
exports.default = TreeStream;
//# sourceMappingURL=TreeStream.js.map