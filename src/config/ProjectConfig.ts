import Atviseproject from '../lib/config/Atviseproject';

/**
 * The path to the project's configuration file.
 * @type {string}
 */
export const path = process.env.ATSCM_CONFIG_PATH;

/**
 * The current project's configuration.
 */
const Config = require(path).default as typeof Atviseproject; // eslint-disable-line global-require

/**
 * The current project's configuration, with overrides (through `ATSCM_PROJECT__` env vars) already
 * handled.
 */
export default class ProjectConfig extends Config {
  /**
   * Return the project configuration override for the given name if available.
   * @param name The variable to return.
   * @return The variables's value or `undefined`.
   */
  static _env(name): string | undefined {
    return process.env[`ATSCM_PROJECT__${name}`];
  }

  /**
   * The atvise server's host. Can be overridden with the `ATSCM_PROJECT__HOST` env variable.
   */
  static get host(): string {
    return this._env('HOST') || super.host;
  }

  /**
   * The atvise server ports to use.
   * @type {Object}
   * @property {number} opc The OPC-UA port the atvise server runs on. Can be overridden with the
   * `ATSCM_PROJECT__PORT__OPC` env variable.
   * @property {number} http The HTTP port the atvise server can be reached at. Can be overridden
   * with the `ATSCM_PROJECT__PORT__HTTP` env variable.
   */
  static get port() {
    return {
      opc: parseInt(this._env('PORT__OPC'), 10) || super.port.opc,
      http: parseInt(this._env('PORT__HTTP'), 10) || super.port.http,
    };
  }

  /**
   * The login to use. Return false if no login is required (default).
   * @type {Object}
   * @property {string} username The username to log in with. Can be overridden with the
   * `ATSCM_PROJECT__LOGIN__USERNAME` env variable.
   * @property {string} password The password to log in with. Can be overridden with the
   * `ATSCM_PROJECT__LOGIN__PASSWORD` env variable.
   */
  static get login() {
    if (this._env('LOGIN__USERNAME') || this._env('LOGIN__PASSWORD')) {
      const { username, password }: { username?: string; password?: string } = super.login || {};

      return {
        username: this._env('LOGIN__USERNAME') || username,
        password: this._env('LOGIN__PASSWORD') || password,
      };
    }

    return super.login;
  }

  private static _sourceNodeRegExp: RegExp;

  /**
   * A regular expression matching all source nodes.
   */
  static get sourceNodeRegExp(): RegExp {
    if (!this._sourceNodeRegExp) {
      this._sourceNodeRegExp = new RegExp(
        `^(${this.nodes.map(({ value }) => `${value.replace(/\./g, '\\.')}`).join('|')})`
      );
    }

    return this._sourceNodeRegExp;
  }

  private static _ignoredNodesRegExp: RegExp;

  /**
   * A regular expression matching all ignored nodes.
   */
  static get ignoredNodesRegExp(): RegExp {
    if (!this._ignoredNodesRegExp) {
      this._ignoredNodesRegExp = new RegExp(
        `^(${this.ignoreNodes.map(({ value }) => `${value.replace(/\./g, '\\.')}`).join('|')})`
      );
    }

    return this._ignoredNodesRegExp;
  }

  /**
   * Returns `true` for all external (not in {@link Atviseproject.nodes} or ignored by
   * {@link Atviseproject.ignoreNodes}).
   * @param id The node id to check.
   * @return If the node is external.
   */
  static isExternal(id: string) {
    return !id.match(this.sourceNodeRegExp) || !!id.match(this.ignoredNodesRegExp);
  }

  /**
   * The connection timeout, in milliseconds. Can be overridden with the `ATSCM_PROJECT__TIMEOUT`
   * env variable.
   * @type {number}
   */
  static get timeout() {
    const env = this._env('TIMEOUT');
    return env ? parseInt(env, 10) : super.timeout;
  }
}
