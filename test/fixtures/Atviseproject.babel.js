import { Atviseproject } from '../../';

export default class TestProject extends Atviseproject {

  static get host() {
    return '10.211.55.4';
  }

  static get port() {
    return {
      opc: 4840,
      http: 80,
    };
  }

  static get login() {
    return false;
  }

}
