'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * The path to the project's configuration file.
 * @type {string}
 */
const path = exports.path = process.env.ATSCM_CONFIG_PATH;

/**
 * The current project's configuration.
 * @type {Atviseproject}
 */
const Config = require(path).default;

/**
 * The current project's configuration, with overrides (through `ATSCM_PROJECT__` env vars) already
 * handled.
 */
class ProjectConfig extends Config {

  /**
   * Return the project configuration override for the given name if available.
   * @param {string} name The variable to return
   * @type {string|undefined} The variables's value or `undefined`.
   */
  static _env(name) {
    return process.env[`ATSCM_PROJECT__${name}`];
  }

  /**
   * The atvise server's host. Can be overridden with the `ATSCM_PROJECT__HOST` env variable.
   * @type {string}
   */
  static get host() {
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
      http: parseInt(this._env('PORT__HTTP'), 10) || super.port.http
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
      return {
        username: this._env('LOGIN__USERNAME') || super.login.username,
        password: this._env('LOGIN__PASSWORD') || super.login.password
      };
    }

    return super.login;
  }

}
exports.default = ProjectConfig;