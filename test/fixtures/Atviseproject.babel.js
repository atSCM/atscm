import { Atviseproject } from '../../';

export default class TestProject extends Atviseproject {

  static get host() {
    return '185.67.228.82';
  }

  static get port() {
    return {
      opc: 4845,
      http: 80,
    };
  }

  static get login() {
    return {
      false
    };
  }

}
