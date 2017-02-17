import { StatusCodes, ClientSession } from 'node-opcua';
import Client from './Client';
import ProjectConfig from '../../config/ProjectConfig';

/**
 * A wrapper around {@link NodeOpcua.ClientSession} used to connect to atvise server.
 */
export default class Session {

  /**
   * Creates and opens a new {@link NodeOpcua.ClientSession}.
   * @return {Promise<NodeOpcua.ClientSession, Error>} Fulfilled with an already opened
   * {@link NodeOpcua.ClientSession}.
   */
  static create() {
    return Client.create()
      .then(client => new Promise((resolve, reject) => {
        client.createSession({
          userName: ProjectConfig.login.username,
          password: ProjectConfig.login.password,
        }, (err, session) => {
          if (err) {
            if (
              [
                'userName === null || typeof userName === "string"',
                'password === null || typeof password === "string"',
              ].includes(err.message) ||
              (err.response &&
              err.response.responseHeader.serviceResult === StatusCodes.BadUserAccessDenied)
            ) {
              reject(new Error('Unable to create session: Invalid login'));
            } else {
              reject(new Error(`Unable to create session: ${err.message}`));
            }
          } else {
            resolve(session);
          }
        });
      }));
  }

  /**
   * Closes the given session.
   * @param {NodeOpcua.ClientSession} session The session to close.
   * @param {Boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<NodeOpcua.ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static close(session, deleteSubscriptions = true) {
    if (!session || !(session instanceof ClientSession)) {
      return Promise.reject(new Error('session is required'));
    }

    return new Promise((resolve, reject) => {
      session.close(deleteSubscriptions, (err) => {
        if (err) {
          reject(new Error(`Unable to close session: ${err.message}`));
        } else {
          session._client.disconnect(clientErr => {
            if (clientErr) {
              reject(new Error(`Unable to disconnect client: ${clientErr.message}`));
            } else {
              resolve(session);
            }
          });
        }
      });
    });
  }

}
