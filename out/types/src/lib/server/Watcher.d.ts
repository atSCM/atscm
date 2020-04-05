/// <reference types="node" />
/**
 * Watches the given nodes for value changes.
 * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
 */
export default class Watcher extends Emitter {
    /**
     * Creates a new Watcher with the given nodes.
     * @param {NodeId[]} nodes The nodes to watch (recursively).
     */
    constructor(nodes?: any[]);
    /**
     * The browser used to subscribe to server nodes.
     * @type {NodeBrowser}
     */
    _nodeBrowser: NodeBrowser;
    /**
     * Resolved once the server subscription is set up.
     * @type {Promise<any>}
     */
    subscriptionStarted: Promise<any>;
    /**
     * Initializes a server subscription.
     * @return {Promise<node-opcua~ClientSubscription>} A setup subscription.
     */
    _setupSubscription(): Promise<any>;
    /** The current session, if connected @type {Session} */
    _session: any;
    /**
     * Subscribes to value changes of a single node.
     * @param {BrowsedNode} node A browsed node.
     */
    _subscribe(node: any): Promise<any>;
    /**
     * Called once a change has been detected and emits a 'change' or 'delete' event.
     * @param {Object} node The node that changed.
     * @param {?node-opcua~Variant} dataValue The current value.
     */
    _handleChange({ nodeId }: any, dataValue: any): void;
    /**
     * Ends monitoring nodes.
     */
    close(): void;
    addListener(event: string | symbol, listener: Function): Watcher;
    on(event: string | symbol, listener: Function): Watcher;
    once(event: string | symbol, listener: Function): Watcher;
    removeListener(event: string | symbol, listener: Function): Watcher;
    removeAllListeners(event?: string | symbol): Watcher;
    setMaxListeners(n: number): Watcher;
    prependListener(event: string | symbol, listener: Function): Watcher;
    prependOnceListener(event: string | symbol, listener: Function): Watcher;
}
import Emitter from "events";
import NodeBrowser from "./NodeBrowser";
