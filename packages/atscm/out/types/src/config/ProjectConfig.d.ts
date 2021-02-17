/**
 * The path to the project's configuration file.
 * @type {string}
 */
export const path: string;
/**
 * The current project's configuration, with overrides (through `ATSCM_PROJECT__` env vars) already
 * handled.
 */
export default class ProjectConfig {
    /**
     * Return the project configuration override for the given name if available.
     * @param {string} name The variable to return.
     * @type {string|undefined} The variables's value or `undefined`.
     */
    static _env(name: string): any;
    /**
     * The atvise server's host. Can be overridden with the `ATSCM_PROJECT__HOST` env variable.
     * @type {string}
     */
    static get host(): string;
    /**
     * The atvise server ports to use.
     * @type {Object}
     * @property {number} opc The OPC-UA port the atvise server runs on. Can be overridden with the
     * `ATSCM_PROJECT__PORT__OPC` env variable.
     * @property {number} http The HTTP port the atvise server can be reached at. Can be overridden
     * with the `ATSCM_PROJECT__PORT__HTTP` env variable.
     */
    static get port(): any;
    /**
     * The login to use. Return false if no login is required (default).
     * @type {Object}
     * @property {string} username The username to log in with. Can be overridden with the
     * `ATSCM_PROJECT__LOGIN__USERNAME` env variable.
     * @property {string} password The password to log in with. Can be overridden with the
     * `ATSCM_PROJECT__LOGIN__PASSWORD` env variable.
     */
    static get login(): any;
    /**
     * A regular expression matching all source nodes.
     * @type {RegExp};
     */
    static get sourceNodeRegExp(): RegExp;
    /**
     * A regular expression matching all ignored nodes.
     * @type {RegExp};
     */
    static get ignoredNodesRegExp(): RegExp;
    /**
     * Returns `true` for all external (not in {@link Atviseproject.nodes} or ignored by
     * {@link Atviseproject.ignoreNodes}).
     * @param {string} id The node id to check.
     * @return {boolean} If the node is external.
     */
    static isExternal(id: string): boolean;
    /**
     * The connection timeout, in milliseconds. Can be overridden with the `ATSCM_PROJECT__TIMEOUT`
     * env variable.
     * @type {number}
     */
    static get timeout(): number;
}
