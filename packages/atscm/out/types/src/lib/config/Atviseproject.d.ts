import NodeId from '../model/opcua/NodeId';
import { Transformer } from '../..';
interface AtserverPortConfiguration {
    /** The OPC-UA port the atvise-server runs on. */
    opc: number;
    /** The HTTP port the atvise-server can be reached at. */
    http: number;
}
interface AtserverCredentials {
    /** The username to log in with. */
    username: string;
    /** The password to log in with. */
    password: string;
}
declare type NodesConfiguration = Array<string | NodeId>;
/**
 * An *atscm* project's configuration.
 * @abstract
 */
export default class Atviseproject {
    /**
     * The atvise-server's host. Defaults to *localhost*.
     */
    static get host(): string;
    /**
     * The atvise-server ports to use.
     */
    static get port(): AtserverPortConfiguration;
    /**
     * The login to use. Return `false` if no login is required (default).
     */
    static get login(): false | AtserverCredentials;
    /**
     * The transformers to use in this project. Returns a {@link DisplayTransformer}, a
     * {@link ScriptTransformer} and a {@link NewlinesTransformer} by default.
     */
    static get useTransformers(): Transformer[];
    /**
     * The atvise-server nodes that atscm should sync. Defaults to the nodes *AGENT*, *SYSTEM*,
     * *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
     */
    static get nodes(): NodesConfiguration;
    /**
     * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
     * displays.
     */
    static get nodesToWatch(): NodesConfiguration;
    /**
     * An array of editor related node ids. They should be ignored in a atscm project.
     */
    static get EditorRelatedNodes(): NodesConfiguration;
    /**
     * An array of server related node ids. They should be ignored in a atscm project
     * as they are read-only.
     */
    static get ServerRelatedNodes(): NodesConfiguration;
    /**
     * Server nodes atscm manages itself. These include the serverscripts used during pull/push for
     * example.
     */
    static get AtscmRelatedNodes(): NodesConfiguration;
    /**
     * These nodes (and their subnodes, if any) will be ignored by atscm. Defaults to
     * {@link Atviseproject.EditorRelatedNodes} combined with
     * {@link Atviseproject.ServerRelatedNodes}.
     */
    static get ignoreNodes(): NodesConfiguration;
    /**
     * Returns an object containing the properties to inspect.
     * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
     */
    static inspect(): {
        host: string;
        port: AtserverPortConfiguration;
        login: false | AtserverCredentials;
        useTransformers: Transformer[];
        nodes: NodesConfiguration;
        nodesToWatch: NodesConfiguration;
        ignoreNodes: NodesConfiguration;
    };
    /**
     * The *version control system* to optimize tasks for.
     * @since 1.0.0
     */
    static get vcs(): 'git' | 'svn';
    /**
     * If atvise builder sort order nodes should be stored.
     * @since 1.0.0
     * @deprecated Mapping source order nodes leads to inconsistent results in many cases.
     */
    static get preserveSortOrderNodes(): boolean;
    /**
     * The connection timeout, in milliseconds.
     */
    static get timeout(): number;
}
export {};
