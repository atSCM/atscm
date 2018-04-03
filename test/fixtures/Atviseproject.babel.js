import Atviseproject from '../../src/lib/config/Atviseproject';
import NodeId from '../../src/lib/model/opcua/NodeId';

export default class TestProject extends Atviseproject {

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

  static get nodesToWatch() {
    return [
      new NodeId('AGENT.DISPLAYS.atSCM.watch'),
    ];
  }

}
