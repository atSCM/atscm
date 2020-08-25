import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import QueueStream from './QueueStream';

/**
 * A mixin that transforms a regular stream into a {@link WaitingStream}, which makes it wait for a
 * node's dependencies to be transformed.
 * @param {QueueStream} Stream The node stream to inherit from.
 * @return {Class<WaitingStream>} The resulting stream class.
 * @example <caption>Basic usage</caption>
 * import QueueStream from 'atscm/src/lib/server/QueueStream';
 * import { waitForDependencies } from 'atscm/src/lib/server/WaitingStream';
 *
 * class MyWaitingStream extends waitForDependencies(QueueStream) {
 *
 *   dependenciesFor(file) {
 *     return [
 *       // An array of node ids
 *     ];
 *   }
 *
 * }
 */
export const waitForDependencies = Stream =>
  class Waiting extends Stream {
    /**
     * Creates a new WaitingStream.
     * @param {Object} options Options passed to the underlying {@link Stream} subclass.
     */
    constructor(options = {}) {
      super(options);

      this._dependencies = {};
      this._waitingFor = {};
      this._finishedProcessing = {};

      this.on('processed-chunk', file => {
        const key = file.nodeId.toString();
        const dependents = this._waitingFor[key];
        delete this._waitingFor[key];
        this._finishedProcessing[key] = true;

        if (dependents) {
          dependents.forEach(d => {
            const k = d.nodeId.toString();
            this._dependencies[k] -= 1;

            if (this._dependencies[k] === 0) {
              super._enqueueChunk(d);
              delete this._dependencies[k];
            }
          });
        }

        this.emit('finished-chunk');
      });
    }

    /**
     * **Must be implemented by all subclasses:** Returns the dependencies for a given file.
     * @typedef {function(file: AtviseFile): NodeId[]} WWaiting#dependenciesFor
     * @param {AtviseFile} file The file to get the dependencies for.
     * @return {NodeId[]} The file's dependencies.
     * @abstract
     */
    // eslint-disable-next-line no-unused-vars
    dependenciesFor(file) {
      throw new Error('#dependenciesFor must be implemented by all subclasses');
    }

    /**
     * Enqueues a file after it's dependencies.
     * @param {AtviseFile} file The file to process.
     */
    _enqueueChunk(file) {
      const dependencies = this.dependenciesFor(file)
        .filter(id => {
          if (id.namespace === 0 || !id.value || ProjectConfig.nodes.includes(id)) {
            return false;
          }

          return (
            !id.value.match(/^(Object|Variable)Types$/) &&
            !id.value.match(/^(Object|Variable)Types\.ATVISE/) &&
            !id.value.match(/^SYSTEM\.LIBRARY\.ATVISE/)
          );
        })
        .map(id => id.toString());

      if (dependencies && dependencies.length) {
        const needToWait = dependencies.reduce((wait, dependency) => {
          if (!this._finishedProcessing[dependency]) {
            const name = file.nodeId.toString();

            this._waitingFor[dependency] = (this._waitingFor[dependency] || []).concat(file);
            this._dependencies[name] = (this._dependencies[name] || 0) + 1;

            return true;
          }
          return wait;
        }, false);

        if (needToWait) {
          return;
        }
      }

      super._enqueueChunk(file);
    }

    /**
     * Delays the streams end until all chunks have been processed.
     * @param {function(err: Error)} callback Called once all chunks have been processed.
     */
    _flush(callback) {
      const checkProcessing = () => {
        if (this._processing || this.hasPending) {
          this.once('finished-chunk', () => checkProcessing());
        } else if (Object.keys(this._waitingFor).length > 0) {
          const first = Object.keys(this._waitingFor)[0];

          Logger.debug(`Missing dependency. Trying to process dependents of ${first}`);

          this.once('finished-chunk', () => checkProcessing());
          this.emit('processed-chunk', { nodeId: first });
        } else {
          super._flush(callback);
        }
      };

      checkProcessing();
    }
  };

/**
 * A {@link QueueStream} that waits for a file's dependencies to be processed before the file is
 * processed itself.
 * @abstract
 */
export default class WaitingStream extends waitForDependencies(QueueStream) {}
