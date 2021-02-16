/// <reference types="../../context" />

//* start output

import { Atviseproject } from 'atscm';

/**
 * atscm configuration of {{name}}.
 */
export default class __CONFIG_CLASS_NAME__ extends Atviseproject {
  /**
   * The atvise-server's host.
   * @type {string}
   */
  static get host() {
    return __INIT__.atviseHost;
  }

  /**
   * The atvise-server ports to use.
   * @type {Object}
   * @property {number} opc The OPC-UA port the atvise-server runs on.
   * @property {number} http The HTTP port the atvise-server can be reached at.
   */
  static get port() {
    return {
      opc: __INIT__.atvisePortOpc,
      http: __INIT__.atvisePortHttp,
    };
  }
  //* {{#if useLogin}}

  /**
   * The login to use. Return `false` if no login is required.
   * @type {boolean|Object}
   * @property {string} username The username to log in with.
   * @property {string} password The password to log in with.
   */
  static get login() {
    return {
      username: __INIT__.atviseUser,
      password: __INIT__.atvisePassword,
    };
  }
  //* {{/if}}

  /**
   * Remove `atv:refpx` and `atv:refpy` attributes from XML to minimize diffs between pulls.
   * @type {boolean}
   */
  static get removeBuilderRefs() {
    return true;
  }
}
