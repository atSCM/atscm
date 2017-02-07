import { Atviseproject } from 'atscm';

/**
 * atvise-scm configuration of {{name}}.
 */
export default class {{pascalcase name}} extends Atviseproject {

  /**
   * The atvise-server's host
   * @type {String}
   */
  static get host() {
    return '{{atviseHost}}';
  }

  /**
   * The atvise-server ports to use.
   * @type {Object}
   * @property {Number} opc The OPC-UA port the atvise-server runs on.
   * @property {Number} http The HTTP port the atvise-server can be reached at.
   */
  static get port() {
    return {
      opc: {{atvisePortOpc}},
      http: {{atvisePortHttp}},
    };
  }

}
