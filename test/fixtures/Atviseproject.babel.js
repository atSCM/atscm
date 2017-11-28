export default class TestProject {

  static get host() {
    return '185.67.228.66';
  }

  static get port() {
    return {
      opc: 4888,
      http: 8888,
    };
  }

  static get login() {
    return {
      username: process.env.ATVISE_USERNAME,
      password: process.env.ATVISE_PASSWORD,
    };
  }

}
