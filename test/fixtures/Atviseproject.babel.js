import Atviseproject from '../../src/lib/config/Atviseproject';
import NodeId from '../../src/lib/model/opcua/NodeId';

export default class TestProject extends Atviseproject {
  static get host() {
    return 'localhost';
  }

  static get port() {
    return {
      opc: 4899,
      http: 99,
    };
  }

  static get login() {
    return {
      username: process.env.ATVISE_USERNAME,
      password: process.env.ATVISE_PASSWORD,
    };
  }

  static get nodesToWatch() {
    return [new NodeId('AGENT.DISPLAYS.atSCM.watch')];
  }
}
