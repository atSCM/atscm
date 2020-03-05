/**
 * A stream that process atvise server requests in parallel.
 * @abstract
 */
export default class QueueStream extends Stream {
    /**
     * Creates a new QueueStream with the given options.
     * @param {Object} [options] The options to use.
     * @param {number} [options.maxParallel] The maximum of parallel tasks to execute.
     */
    constructor(options?: {
        maxParallel?: number;
    });
    /**
     * The number of running operations.
     * @type {Number}
     */
    _processing: Number;
    /**
     * The number of chunks processed so far.
     * @type {Number}
     */
    _processed: Number;
    /**
     * The queued chunks.
     * @type {*[]}
     */
    _queued: any[];
    /**
     * The maximum of parallel tasks to execute
     * @type {number}
     */
    _maxParallel: number;
    /**
     * The timestamp of the date when the stream was created.
     * @type {Number}
     */
    _start: Number;
    /**
     * `true` if there are queued operations or an operation is running right now.
     * @type {boolean}
     */
    get hasPending(): boolean;
    /**
     * `true` if there are no queued operations.
     * @type {boolean}
     */
    get queueEmpty(): boolean;
    /**
     * The number of chunks already processed.
     * @type {number}
     */
    get processed(): number;
    /**
     * The number of processed chunks per second.
     * @type {number}
     */
    get opsPerSecond(): number;
    /**
     * The error message to use when processing a chunk fails. **Must be overridden by all
     * subclasses!**.
     * @param {*} chunk The chunk being processed.
     * @return {string} The error message to use.
     * @abstract
     */
    processErrorMessage(chunk: any): string;
    /**
     * The function to call when a chunk is ready to be processed. **Must be overridden by all
     * subclasses.**.
     * @param {*} chunk The chunk to process.
     * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
     * handleErrors Call this function to handle errors and bad status codes. When no error occured
     * and the status code received is fine, `onSuccess` is called. Further processing of valid
     * chunks, for example Recursions should happen in `onSuccess`. **Note that `onSuccess` is an
     * asynchronous function with a callback as an argument.**.
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
    processChunk(chunk: any, handleErrors: any): void;
    /**
     * Calls {@link QueueStream#processChunk} and handles errors and invalid status codes.
     * @param {*} chunk The chunk to process.
     * @emits {*} Emits a `processed-chunk` event once a chunk was processed.
     */
    _processChunk(chunk: any): void;
    /**
     * Enqueues the given chunk for processing.
     * @param {*} chunk The chunk to enqueue.
     */
    _enqueueChunk(chunk: any): void;
    /**
     * Calls {@link QueueStream#_enqueueChunk} as soon as the stream's session is opened.
     * @param {*} chunk The chunk to transform.
     * @param {string} enc The encoding used.
     * @param {Function} callback Called once the chunk has been enqueued.
     */
    _transform(chunk: any, enc: string, callback: Function): void;
    /**
     * Waits for pending operations to complete.
     * @param {Function} callback Called once all queued chunks have been processed.
     */
    _flush(callback: Function): void;
}
import Stream from "./Stream";
