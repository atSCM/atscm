/// <reference types="node" />
import { Variant } from 'node-opcua/lib/datamodel/variant';
import { SourceNode, NodeOptions, NodeDefinition } from '../model/Node';
import { Omit } from '../helpers/types';
declare type FileNodeOptions = Omit<NodeOptions, 'nodeClass'> & NodeDefinition;
/**
 * A node returned by the {@link SourceStream}.
 */
export declare class FileNode extends SourceNode {
    /**
     * Creates a new node.
     * @param options The options to use.
     */
    constructor({ nodeClass, dataType, arrayType, references, nodeId, ...options }: FileNodeOptions);
    protected _rawValue?: Buffer;
    setRawValue(value: Buffer): void;
    private hasRawValue;
    /**
     * A node's raw value, decoded into a string.
     */
    get stringValue(): string;
    /** The node's value (may be incomplete, use {@link FileNode#value} to ensure). */
    valueSoFar: Partial<Variant>;
    private valueIsComplete;
    /**
     * A node's {@link node-opcua~Variant} value.
     */
    get variantValue(): Variant;
    get value(): Variant;
}
/**
 * Returns `true` for definition file paths.
 * @param path The path to check.
 * @return If the file at path is a definition file.
 */
export declare function isDefinitionFile(path: string): boolean;
declare type NodeHandler<R = void> = (node: FileNode) => R;
interface SourceBrowserOptions {
    handleNode: NodeHandler<Promise<void>>;
    readNodeFile: NodeHandler<boolean>;
    atserverVersion: string;
}
/**
 * Browses the local file system for nodes.
 */
export declare class SourceBrowser {
    /** The queue processing incoming paths / nodes. @type {p-queue~PQueue} */
    private _queue;
    /** A callback called with every discovered node. */
    private _nodeHandler;
    /** A callback deciding if a node file should be read. */
    private _readNodeFile;
    /** The pushed node's ids */
    private _pushed;
    /** The pushed node's paths */
    private _pushedPath;
    /** Stores how queued nodes depend on each other */
    private _dependingOn;
    private _atserverVersion;
    /**
     * Sets up a new browser.
     * @param options The options to apply.
     * @param options.handleNode A callback called with every discovered node.
     * @param options.readNodeFile A callback deciding if a node file should be read.
     */
    constructor({ handleNode, readNodeFile, atserverVersion }: SourceBrowserOptions);
    get atserverVersion(): string;
    /**
     * A function to be called once an error occurres during parallel processing.
     * @param error The error to exit with.
     */
    private _reject;
    /**
     * Starts the browser at the given path.
     * @param path The path to start browsing at.
     * @param options Passed directly to {@link SourceBrowser#processPath}.
     * @return Fulfilled once browsing is complete.
     */
    browse(path: string, options?: {}): Promise<void>;
    /**
     * Enqueues a {@link SourceBrowser#_processPath} call with the given options.
     * @param options Passed directly to {@link SourceBrowser#_processPath}.
     */
    processPath(options: ProcessPathOptions): Promise<FileNode | void>;
    /**
     * Can be called by transformers to read this path before finishing it's parent nodes.
     * @param {Object} options Passed directly to {@link SourceBrowser#_processPath}.
     * @param {string} options.path The path to read.
     */
    readNode({ path }: {
        path: string;
    }): Promise<FileNode>;
    /**
     * Where the real browsing happens: Stats the given path, discovering new node definition files,
     * if any and finally pushes discovered nodes to {@link SourceBrowser#_processNode}.
     * @param {Object} options The options to use.
     */
    private _processPath;
    /**
     * Handles a node's dependencies and calls {@link SourceBrowser#_pushNode} once it's ready.
     * @param node A discovered node.
     */
    private _processNode;
    /**
     * Reads a node's value file (if it's a variable) and calls {@link SourceBrowser#_nodeHandler}
     * with it, finishing the node's processing and promoting it's dependents, if any.
     * @param node A discovered node.
     * @return The node, once it's fully processed.
     */
    private _pushNode;
}
/**
 * Starts a new source browser at the given path.
 * @param path The path to start browsing with.
 * @param options Passed directly to {@link SourceBrowser#constructor}.
 * @return A promise resolved once browsing is finished, with an addional *browser* property holding
 * the SourceBrowser instance created.
 */
export default function src(path: string, options: SourceBrowserOptions): Promise<void> & {
    browser: SourceBrowser;
};
interface DiscoveredNodeFile {
    path: string;
    name: string;
    push: boolean;
    parent?: FileNode;
    children?: DiscoveredNodeFile[];
}
declare type ProcessPathOptions = Partial<DiscoveredNodeFile> & {
    path: string;
    singleNode?: boolean;
};
export {};
