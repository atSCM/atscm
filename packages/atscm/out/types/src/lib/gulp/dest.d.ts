/**
 * Creates a new {@link WriteStream} to write to *path*.
 * @param {string} path The path to write to.
 * @param {Object} [options] The options to use. Passed to {@link WriteStream#constructor}.
 */
export default function dest(path: string, { cleanRenameConfig }?: any): WriteStream;
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
        cleanRenameConfig: boolean;
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
    _loadRenameConfig: Promise<any>;
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
    writeAsync(node: any): Promise<any>;
    /**
     * Writes multiple nodes in parallel.
     * @param {Node[]} nodes The nodes to write.
     * @param {function(error: ?Error): void} callback Called once all nodes have been written.
     */
    _writev(nodes: any[], callback: (arg0: any, arg1: Error | null) => void): void;
    /**
     * Destroys the stream.
     * @param {?Error} err The error that caused the destroy.
     * @param {function(err: ?Error): void} callback Called once finished.
     */
    _destroy(err: Error | null, callback: (arg0: Error, arg1: Error | null) => void): void;
    /**
     * Writes the updated rename config to disk.
     */
    writeRenamefile(): Promise<void>;
}
import { Writable } from ".pnpm/@types/node@6.0.78/node_modules/@types/node";
