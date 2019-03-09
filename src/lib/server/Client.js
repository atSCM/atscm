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
    if (this._connecting) { return this._connecting; }

    const client = new OPCUAClient({
      requestedSessionTimeout: 600000,
      keepSessionAlive: true,
      certificateFile: join(__dirname, '../../../res/certificates/certificate.pem'),
      privateKeyFile: join(__dirname, '../../../res/certificates/key.pem'),
    });

    this._connecting = new Promise((resolve, reject) => {
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

    return this._connecting;
  }

  /**
   * Disconnects the shared client.
   * @return {Promise<node-opcua~OPCUAClient} The (now disconnected) client.
   */
  static async disconnect() {
    const getClient = this._connecting;
    delete this._connecting;

    const client = await getClient;

    return new Promise((resolve, reject) => {
      client.disconnect(err => {
        if (err) { return reject(err); }
        return resolve(client);
      });
    });
  }

}
