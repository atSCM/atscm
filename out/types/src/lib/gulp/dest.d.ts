/**
 * Creates a new {@link WriteStream} to write to *path*.
 * @param {string} path The path to write to.
 * @param {Object} [options] The options to use. Passed to {@link WriteStream#constructor}.
 */
export default function dest(path: string, { cleanRenameConfig }?: any): any;
/**
 * Relative path to the rename file.
 * @type {string}
 */
export const renameConfigPath: string;
/**
 * A stream that writes {@link Node}s to the file system.
 */
export class WriteStream extends Writable {
    /**
     * Creates a new WriteStream.
     * @param {Object} options The options to use.
     * @param {string} options.path The path to write to **(required)**.
     * @param {string} options.base The base path to write to (defaults to *path*).
     * @param {boolean} [options.cleanRenameConfig=false] If unused entries should be removed when
     * rename config is written.
     */
    constructor(options: {
        path: string;
        base: string;
        cleanRenameConfig?: boolean;
    });
    /**
     * If the stream is destroyed.
     * @type {boolean}
     */
    _isDestroyed: boolean;
    /**
     * The number of processed nodes.
     * @type {number}
     */
    _processed: number;
    /**
     * The number of written nodes.
     * @type {number}
     */
    _written: number;
    /**
     * The base to output to.
     * @type {string}
     */
    _base: string;
    /**
     * The object stored in the *rename file* (usually at './atscm/rename.json')
     */
    _renameConfig: any;
    _renamesUsed: {};
    _cleanRenameConfig: boolean;
    /**
     * A promise that resolves once the *rename file* is loaded.
     * @type Promise<Object>
     */
    _loadRenameConfig: Promise<Object>;
    /**
     * A map of ids used for renaming.
     */
    _idMap: Map<any, any>;
    /**
     * If writes should actually be performed. Set to `false` once id conflicts were discovered.
     */
    _performWrites: boolean;
    /**
     * The IDs that are affected by node id conflicts, lowercased.
     * @type {Set<string>}
     */
    _conflictingIds: Set<string>;
    /**
     * The number of id conflicts discovered.
     * @type {number}
     */
    _discoveredIdConflicts: number;
    /**
     * If the stream is destroyed.
     * @type {boolean}
     */
    get isDestroyed(): boolean;
    /**
     * Transverses the node tree to see if any parent node has an id conflict.
     * @param {ServerNode} node The processed node.
     * @return {boolean} `true` if a parent node has an id conflict.
     */
    _parentHasIdConflict(node: any): boolean;
    _outputFile(path: any, content: any): Promise<void>;
    /**
     * Writes a single node to disk.
     * @param {ServerNode} node The processed node.
     * @return {Promise<boolean>} Resolves once the node has been written, `true` indicates the node
     * has actually been written.
     */
    _writeNode(node: any): Promise<boolean>;
    /**
     * Writes a single node to the file system.
     * @param {Node} node The node to write.
     * @param {string} enc The encoding used.
     * @param {function(err: ?Error): void} callback Called once finished.
     */
    _write(node: any, enc: string, callback: (arg0: any, arg1: Error) => void): void;
    writeAsync(node: any): Promise<any>;
    /**
     * Writes multiple nodes in parallel.
     * @param {Node[]} nodes The nodes to write.
     * @param {function(error: ?Error): void} callback Called once all nodes have been written.
     */
    _writev(nodes: any[], callback: (arg0: any, arg1: Error) => void): void;
    /**
     * Destroys the stream.
     * @param {?Error} err The error that caused the destroy.
     * @param {function(err: ?Error): void} callback Called once finished.
     */
    _destroy(err: Error, callback: (arg0: Error, arg1: Error) => void): void;
    /**
     * Writes the updated rename config to disk.
     */
    writeRenamefile(): Promise<void>;
    setDefaultEncoding(encoding: string): WriteStream;
    addListener(event: string, listener: Function): WriteStream;
    addListener(event: "close", listener: () => void): WriteStream;
    addListener(event: "drain", listener: () => void): WriteStream;
    addListener(event: "error", listener: (err: Error) => void): WriteStream;
    addListener(event: "finish", listener: () => void): WriteStream;
    addListener(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    addListener(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    on(event: string, listener: Function): WriteStream;
    on(event: "close", listener: () => void): WriteStream;
    on(event: "drain", listener: () => void): WriteStream;
    on(event: "error", listener: (err: Error) => void): WriteStream;
    on(event: "finish", listener: () => void): WriteStream;
    on(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    on(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    once(event: string, listener: Function): WriteStream;
    once(event: "close", listener: () => void): WriteStream;
    once(event: "drain", listener: () => void): WriteStream;
    once(event: "error", listener: (err: Error) => void): WriteStream;
    once(event: "finish", listener: () => void): WriteStream;
    once(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    once(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    prependListener(event: string, listener: Function): WriteStream;
    prependListener(event: "close", listener: () => void): WriteStream;
    prependListener(event: "drain", listener: () => void): WriteStream;
    prependListener(event: "error", listener: (err: Error) => void): WriteStream;
    prependListener(event: "finish", listener: () => void): WriteStream;
    prependListener(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    prependListener(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    prependOnceListener(event: string, listener: Function): WriteStream;
    prependOnceListener(event: "close", listener: () => void): WriteStream;
    prependOnceListener(event: "drain", listener: () => void): WriteStream;
    prependOnceListener(event: "error", listener: (err: Error) => void): WriteStream;
    prependOnceListener(event: "finish", listener: () => void): WriteStream;
    prependOnceListener(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    prependOnceListener(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    removeListener(event: string, listener: Function): WriteStream;
    removeListener(event: "close", listener: () => void): WriteStream;
    removeListener(event: "drain", listener: () => void): WriteStream;
    removeListener(event: "error", listener: (err: Error) => void): WriteStream;
    removeListener(event: "finish", listener: () => void): WriteStream;
    removeListener(event: "pipe", listener: (src: import("stream").Readable) => void): WriteStream;
    removeListener(event: "unpipe", listener: (src: import("stream").Readable) => void): WriteStream;
    removeAllListeners(event?: string | symbol): WriteStream;
    setMaxListeners(n: number): WriteStream;
}
import { Writable } from "node";
