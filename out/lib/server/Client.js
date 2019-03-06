"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

var _opcua_client = require("node-opcua/lib/client/opcua_client");

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A wrapper around {@link node-opcua~OPCUAClient} used to connect to atvise server.
 */
class Client {
  /**
   * Creates and connects a new instance of {@link node-opcua~OPCUAClient}.
   * @return {Promise<node-opcua~OPCUAClient, Error>} Fulfilled with an already connected
   * {@link node-opcua~OPCUAClient} instance, rejected if an error occured.
   */
  static create() {
    const client = new _opcua_client.OPCUAClient({
      requestedSessionTimeout: 600000,
      keepSessionAlive: true,
      certificateFile: (0, _path.join)(__dirname, '../../../res/certificates/certificate.pem'),
      privateKeyFile: (0, _path.join)(__dirname, '../../../res/certificates/key.pem')
    });
    return new Promise((resolve, reject) => {
      const endpoint = `opc.tcp://${_ProjectConfig.default.host}:${_ProjectConfig.default.port.opc}`;
      setTimeout(() => reject(new Error(`Unable to connect to ${endpoint}: Connection timed out`)), 5000);
      client.connect(endpoint, err => {
        if (err) {
          reject(new Error(`Unable to connect to ${endpoint}: ${err.message}`));
        } else {
          resolve(client);
        }
      });
    });
  }

}

exports.default = Client;
//# sourceMappingURL=Client.js.map