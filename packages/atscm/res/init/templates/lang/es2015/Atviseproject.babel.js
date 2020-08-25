import { Atviseproject } from 'atscm';

/**
 * atscm configuration of {{name}}.
 */
export default class {{pascalcase name}} extends Atviseproject {

  /**
   * The atvise-server's host
   * @type {string}
   */
  static get host() {
    return '{{atviseHost}}';
  }

  /**
   * The atvise-server ports to use.
   * @type {Object}
   * @property {number} opc The OPC-UA port the atvise-server runs on.
   * @property {number} http The HTTP port the atvise-server can be reached at.
   */
  static get port() {
    return {
      opc: {{atvisePortOpc}},
      http: {{atvisePortHttp}},
    };
  }
  {{#if useLogin}}

  /**
   * The login to use. Return `false` if no login is required.
   * @type {boolean|Object}
   * @property {string} username The username to log in with.
   * @property {string} password The password to log in with.
   */
  static get login() {
    return {
      username: '{{atviseUser}}',
      password: '{{atvisePassword}}',
    };
  }
  {{/if}}

}
