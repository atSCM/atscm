import Atviseproject from '../../src/lib/config/Atviseproject';

export default class TestProject extends Atviseproject {

  static get host() {
    return 'atserver';
  }

  static get port() {
    return {
      opc: 4840,
      http: 9000,
    };
  }

  static get login() {
    return {
      username: process.env.ATVISE_USERNAME,
      password: process.env.ATVISE_PASSWORD,
    };
  }

}
