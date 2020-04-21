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
    constructor(nodesToBrowse: any[], options?: {
        recursive?: boolean;
        ignoreNodes?: any[];
    });
    /**
     * If the discovered nodes should be browsed as well.
     * @type {Boolean}
     */
    recursive: Boolean;
    /**
     * The timestamp when the stream started.
     * @type {number}
     */
    _start: number;
    /**
     * If the stream is destroyed.
     * @type {boolean}
     */
    _isDestroyed: boolean;
    /**
     * The stream's browser
     * @type {NodeBrowser}
     */
    _browser: NodeBrowser;
    /**
     * If the stream is destoyed.
     * @type {boolean}
     */
    get isDestroyed(): boolean;
    /**
     * Starts the browser.
     */
    _read(): void;
    /**
     * Destroys the stream.
     * @param {?Error} err The error that caused the destroy.
     * @param {function(err: ?Error): void} callback Called once finished.
     */
    _destroy(err: Error, callback: (arg0: Error, arg1: Error) => void): void;
    /**
     * The number of processed nodes.
     * @type {number}
     */
    get processed(): number;
    /**
     * The number of processed chunks per second.
     * @type {number}
     */
    get opsPerSecond(): number;
    pause(): NodeStream;
    resume(): NodeStream;
    addListener(event: string, listener: Function): NodeStream;
    addListener(event: string, listener: Function): NodeStream;
    addListener(event: "close", listener: () => void): NodeStream;
    addListener(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    addListener(event: "end", listener: () => void): NodeStream;
    addListener(event: "readable", listener: () => void): NodeStream;
    addListener(event: "error", listener: (err: Error) => void): NodeStream;
    on(event: string, listener: Function): NodeStream;
    on(event: "close", listener: () => void): NodeStream;
    on(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    on(event: "end", listener: () => void): NodeStream;
    on(event: "readable", listener: () => void): NodeStream;
    on(event: "error", listener: (err: Error) => void): NodeStream;
    once(event: string, listener: Function): NodeStream;
    once(event: "close", listener: () => void): NodeStream;
    once(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    once(event: "end", listener: () => void): NodeStream;
    once(event: "readable", listener: () => void): NodeStream;
    once(event: "error", listener: (err: Error) => void): NodeStream;
    prependListener(event: string, listener: Function): NodeStream;
    prependListener(event: "close", listener: () => void): NodeStream;
    prependListener(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    prependListener(event: "end", listener: () => void): NodeStream;
    prependListener(event: "readable", listener: () => void): NodeStream;
    prependListener(event: "error", listener: (err: Error) => void): NodeStream;
    prependOnceListener(event: string, listener: Function): NodeStream;
    prependOnceListener(event: "close", listener: () => void): NodeStream;
    prependOnceListener(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    prependOnceListener(event: "end", listener: () => void): NodeStream;
    prependOnceListener(event: "readable", listener: () => void): NodeStream;
    prependOnceListener(event: "error", listener: (err: Error) => void): NodeStream;
    removeListener(event: string, listener: Function): NodeStream;
    removeListener(event: "close", listener: () => void): NodeStream;
    removeListener(event: "data", listener: (chunk: string | Buffer) => void): NodeStream;
    removeListener(event: "end", listener: () => void): NodeStream;
    removeListener(event: "readable", listener: () => void): NodeStream;
    removeListener(event: "error", listener: (err: Error) => void): NodeStream;
    removeAllListeners(event?: string | symbol): NodeStream;
    setMaxListeners(n: number): NodeStream;
}
import { Readable } from "node";
import NodeBrowser from "./NodeBrowser";
