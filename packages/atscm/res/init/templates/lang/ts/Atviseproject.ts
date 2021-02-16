// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../context.d.ts" />

//* start output

import { Atviseproject } from 'atscm';

/**
 * atscm configuration of {{name}}.
 */
export default class __CONFIG_CLASS_NAME__ extends Atviseproject {
  /**
   * The atvise-server's host.
   */
  static get host() {
    return __INIT__.atviseHost;
  }

  /**
   * The atvise-server ports to use.
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
   */
  static get removeBuilderRefs(): boolean {
    return true;
  }
}
