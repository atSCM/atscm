import { StatusCodes } from 'node-opcua';
import Stream from './Stream';

/**
 * A stream that process atvise server requests in parallel.
 * @abstract
 */
export default class QueueStream extends Stream {

  /**
   * Creates a new QueueStream with the given options.
   * @param {Object} [options] The options to use
   * @param {Number} [options.maxParallel] The maximum of parallel tasks to execute.
   */
  constructor(options = {}) {
    const maxParallel = options.maxParallel || 250;
    super(Object.assign(options, { highWaterMark: maxParallel }));

    /**
     * The number of running operations.
     * @type {Number}
     */
    this._processing = 0;

    /**
     * The number of chunks processed so far.
     * @type {Number}
     */
    this._processed = 0;

    /**
     * The queued chunks.
     * @type {*[]}
     */
    this._queued = [];

    /**
     * The maximum of parallel tasks to execute
     * @type {number}
     */
    this._maxParallel = maxParallel;

    /**
     * The timestamp of the date when the stream was created.
     * @type {Number}
     */
    this._start = (new Date()).getTime();

    this.on('processed-chunk', () => {
      if (!this.queueEmpty) {
        this._processChunk(this._queued.shift());
      } else if (this._processing === 0) {
        this.emit('drained');
      }
    });
  }

  /**
   * `true` if there are queued operations or an operation is running right now.
   * @type {Boolean}
   */
  get hasPending() {
    return this._processing > 0 || this._queued.length > 0;
  }

  /**
   * `true` if there are no queued operations
   * @type {Boolean}
   */
  get queueEmpty() {
    return this._queued.length === 0;
  }

  /**
   * The number of chunks already processed.
   * @type {Number}
   */
  get processed() {
    return this._processed;
  }

  /**
   * The number of processed chunks per second.
   * @type {Number}
   */
  get opsPerSecond() {
    return (this._processed / (((new Date()).getTime() - this._start) / 1000)) || 0;
  }

  /**
   * The error message to use when processing a chunk fails. **Must be overridden by all
   * subclasses!**
   * @param {*} chunk The chunk being processed.
   * @return {String} The error message to use.
   * @abstract
   */
  processErrorMessage(chunk) { // eslint-disable-line no-unused-vars
    throw new Error('QueueStream#processErrorMessage must be implemented by all subclasses');
  }

  /**
   * The function to call when a chunk is ready to be processed. **Must be overridden by all
   * subclasses.**
   * @param {*} chunk The chunk to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors Call this function to handle errors and bad status codes. When no error occured
   * and the status code received is fine, `onSuccess` is called. Further processing of valid
   * chunks, e.g. recursions should happen in `onSuccess`. **Note that `onSuccess` is an
   * asynchronous function with a callback as an argument.**
   * @example <caption>Basic implementation</caption>
   * class MyQueueStream extends QueueStream {
   *   ...
   *   processChunk(chunk, handle) {
   *     client.session.doSomething((err, result, statusCode) => handle(err, statusCode, done => {
   *       // This is called if err is falsy and status code is node-opcua~StatusCodes.Good
   *       doSomethingWith(result);
   *       done();
   *     }));
   *   }
   *   ...
   * }
   * @example <caption>Implement a recursion</caption>
   * class RecursiveQueueStream extends QueueStream {
   *   ...
   *   processChunk(chunk, handle) {
   *     client.session.doSomething((err, result, statusCode) => handle(err, statusCode, done => {
   *       // Write the result back to the stream.
   *       // This means, that `result` will be queued and, as soon as possible, #processChunk will
   *       // be called with `result` as the `chunk` argument.
   *       this.write(result, null, done);
   *     }));
   *   }
   *   ...
   * }
   * @example <caption>Allowing some invalid status codes</caption>
   * import { StatusCodes } from 'node-opcua';
   *
   * class FriendlyQueueStream extends QueueStream {
   *   ...
   *   processChunk(chunk, handle) {
   *     client.session.doSomething((err, result, statusCode) => {
   *       if (statusCode === StatusCodes.BadUserAccessDenied) {
   *         Logger.warn(`Ignored invalid status: ${statusCode.description}`);
   *         handle(err, StatusCodes.Good, done => done());
   *       } else {
   *         handle(err, statusCode, done => done());
   *       }
   *     });
   *   }
   *   ...
   * }
   * @abstract
   */
  processChunk(chunk, handleErrors) { // eslint-disable-line no-unused-vars
    handleErrors(new Error('QueueStream#processChunk must be implemented by all subclasses'));
  }

  /**
   * Calls {@link QueueStream#processChunk} and handles errors and invalid status codes.
   * @param {*} chunk The chunk to process.
   * @emits {*} Emits a `processed-chunk` event once a chunk was processed.
   */
  _processChunk(chunk) {
    this._processing++;

    this.processChunk(chunk, (err, statusCode, onSuccess) => {
      if (err) {
        this.emit('error', new Error(`${this.processErrorMessage(chunk)}: ${err.message}`));
      } else if (statusCode !== StatusCodes.Good) {
        this.emit('error',
          new Error(`${this.processErrorMessage(chunk)}: ${statusCode.description}`));
      } else {
        onSuccess(() => {
          this._processing--;
          this._processed++;
          this.emit('processed-chunk', chunk);
        });
      }
    });
  }

  /**
   * Enqueues the given chunk for processing.
   * @param {*} chunk The chunk to enqueue.
   */
  _enqueueChunk(chunk) {
    if (this._processing < this._maxParallel) {
      this._processChunk(chunk);
    } else {
      this._queued.push(chunk);
    }
  }

  /**
   * Calls {@link QueueStream#_enqueueChunk} as soon as the stream's session is opened.
   * @param {*} chunk The chunk to transform.
   * @param {String} enc The encoding used.
   * @param {function} callback Called once the chunk has been enqueued.
   */
  _transform(chunk, enc, callback) {
    if (this.session) {
      this._enqueueChunk(chunk);
      callback();
    } else {
      this.once('session-open', () => {
        this._enqueueChunk(chunk);
        callback();
      });
    }
  }

  /**
   * Waits for pending operations to complete.
   * @param {function} callback Called once all queued chunks have been processed.
   */
  _flush(callback) {
    if (this.hasPending) {
      this.once('drained', () => {
        super._flush(callback);
      });
    } else {
      super._flush(callback);
    }
  }

}
