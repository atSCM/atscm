import { OPCUAClient } from 'node-opcua';
import ProjectConfig from '../../config/ProjectConfig';

let client = null;

/**
 * A singleton wrapper around node-opcua's OPCUAClient class.
 *
 * @example <caption>Get the shared instance</caption>
 * Client.shared()
 *   .then(client => {
 *     // do something with `client`
 *   });
 */
export default class Client extends OPCUAClient {

  /**
   * **Should never be called directly.** Use {Client.shared} instead.
   */
  constructor() {
    throw new Error('Client is not meant to be instantiated. Use Client.shared instead');
  }

  /**
   * Returns the shared client instance.
   * @return {Promise<Client, Error>} Resolved with the shared client, rejected if unable to
   * connect.
   */
  static shared() {
    if (client) {
      return Promise.resolve(client);
    }

    return new Promise((resolve, reject) => {
      const cli = new OPCUAClient({
        // Insert options
        certificateFile: null
      });

      cli.connect(`opc.tcp://${ProjectConfig.host}:${ProjectConfig.port.opc}`, err => {
        if (err) {
          reject(err);
        } else {
          resolve(client = cli);
        }
      });
    });
  }

}
