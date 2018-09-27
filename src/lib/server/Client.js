import { join } from 'path';
import { OPCUAClient } from 'node-opcua/lib/client/opcua_client';
import ProjectConfig from '../../config/ProjectConfig';

/**
 * A wrapper around {@link node-opcua~OPCUAClient} used to connect to atvise server.
 */
export default class Client {

  /**
   * Creates and connects a new instance of {@link node-opcua~OPCUAClient}.
   * @return {Promise<node-opcua~OPCUAClient, Error>} Fulfilled with an already connected
   * {@link node-opcua~OPCUAClient} instance, rejected if an error occured.
   */
  static create() {
    const client = new OPCUAClient({
      requestedSessionTimeout: 600000,
      keepSessionAlive: true,
      certificateFile: join(__dirname, '../../../res/certificates/client_selfsigned_cert_1024.pem'),
      privateKeyFile: join(__dirname, '../../../res/certificates/client_key_1024.pem'),
    });

    return new Promise((resolve, reject) => {
      const endpoint = `opc.tcp://${ProjectConfig.host}:${ProjectConfig.port.opc}`;

      setTimeout(() => reject(
        new Error(`Unable to connect to ${endpoint}: Connection timed out`)
      ), 5000);

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
