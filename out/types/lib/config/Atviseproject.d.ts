/**
 * An *atscm* project's configuration.
 * @abstract
 */
export default class Atviseproject {
    /**
     * The atvise-server's host. Defaults to *localhost*.
     * @type {string}
     */
    static get host(): string;
    /**
     * The atvise-server ports to use.
     * @type {Object}
     * @property {number} [opc=4840] The OPC-UA port the atvise-server runs on.
     * @property {number} [http=80] The HTTP port the atvise-server can be reached at.
     */
    static get port(): any;
    /**
     * The login to use. Return `false` if no login is required (default).
     * @type {boolean|Object}
     * @property {string} username The username to log in with.
     * @property {string} password The password to log in with.
     */
    static get login(): any;
    /**
     * The transformers to use in this project. Returns a {@link DisplayTransformer}, a
     * {@link ScriptTransformer} and a {@link NewlinesTransformer} by default.
     * @type {Transformer[]}
     */
    static get useTransformers(): any[];
    /**
     * The atvise-server nodes that atscm should sync. Defaults to the nodes
     * *AGENT*, *SYSTEM*, *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
     * @type {string[]|NodeId[]}
     */
    static get nodes(): string[] | NodeId[];
    /**
     * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
     * displays.
     * @type {string[]|NodeId[]}
     */
    static get nodesToWatch(): string[] | NodeId[];
    /**
     * An array of editor related node ids. They should be ignored in a atscm project.
     * @type {NodeId[]}
     */
    static get EditorRelatedNodes(): NodeId[];
    /**
     * An array of server related node ids. They should be ignored in a atscm project
     * as they are read-only.
     * @type {NodeId[]}
     */
    static get ServerRelatedNodes(): NodeId[];
    /**
     * Server nodes atscm manages itself. These include the serverscripts used during pull/push for
     * example.
     * @type {NodeId[]}
     */
    static get AtscmRelatedNodes(): NodeId[];
    /**
     * These nodes (and their subnodes, if any) will be ignored by atscm. Defaults to
     * {@link Atviseproject.EditorRelatedNodes} combined with
     * {@link Atviseproject.ServerRelatedNodes}.
     * @type {NodeId[]}
     */
    static get ignoreNodes(): NodeId[];
    /**
     * Returns an object containing the properties to inspect.
     * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
     * @return {Object} The object to inspect.
     */
    static inspect(): any;
    /**
     * The *version control system* to optimize tasks for.
     * @type {'git' | 'svn'}
     * @since 1.0.0
     */
    static get vcs(): "svn" | "git";
    /**
     * If atvise builder sort order nodes should be stored.
     * @type {boolean}
     * @since 1.0.0
     * @deprecated Mapping source order nodes leads to inconsistent results in many cases.
     */
    static get preserveSortOrderNodes(): boolean;
    /**
     * The connection timeout, in milliseconds.
     * @type {number}
     */
    static get timeout(): number;
}
import NodeId from "../model/opcua/NodeId";
