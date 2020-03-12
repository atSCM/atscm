import { Atviseproject } from 'atscm';

/**
 * atscm configuration of {{name}}.
 */
export default class {{pascalcase name}} extends Atviseproject {

  /**
   * The atvise-server's host.
   */
  static get host() {
    return '{{atviseHost}}';
  }

  /**
   * The atvise-server ports to use.
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
   */
  static get login() {
    return {
      username: '{{atviseUser}}',
      password: '{{atvisePassword}}',
    };
  }
  {{/if}}

}
