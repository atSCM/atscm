import Emitter from 'events';
import { StatusCodes, ClientSession } from 'node-opcua';
import Client from './Client';
import ProjectConfig from '../../config/ProjectConfig';

const emitter = new Emitter();
const openSessions = [];
let openingSessions = 0;

/**
 * A wrapper around {@link node-opcua~ClientSession} used to connect to atvise server.
 */
export default class Session {

  /**
   * Creates and opens a new {@link node-opcua~ClientSession}.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
   * {@link node-opcua~ClientSession}.
   */
  static create() {
    return Client.create()
      .then(client => new Promise((resolve, reject) => {
        openingSessions++;

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

          openSessions.push(session);
          openingSessions--;

          if (openingSessions === 0) {
            emitter.emit('all-open');
          }
        });
      }));
  }

  /**
   * Closes the given session.
   * @param {node-opcua~ClientSession} session The session to close.
   * @param {Boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static close(session, deleteSubscriptions = true) {
    if (!session || !(session instanceof ClientSession)) {
      return Promise.reject(new Error('session is required'));
    }

    if (session._closed) {
      return Promise.resolve();
    }

    if (session._closing) {
      return new Promise(resolve => {
        session.on('session_closed', () => {
          resolve(session);
        });
      });
    }

    Object.assign(session, { _closing: true });

    return new Promise((resolve, reject) => {
      session.close(deleteSubscriptions, (err) => {
        if (err) {
          if (err.message === 'no channel') {
            resolve(session);
          } else {
            reject(new Error(`Unable to close session: ${err.message}`));
          }
        } else {
          session._client.disconnect(clientErr => {
            if (clientErr) {
              reject(new Error(`Unable to disconnect client: ${clientErr.message}`));
            } else {
              const i = openSessions.indexOf(session);

              if (i >= 0) {
                openSessions.splice(i, 1);
              } else {
                // FIXME: Throw error here, this should never happen
              }

              Object.assign(session, { _closed: true });
              resolve(session);
            }
          });
        }
      });
    });
  }

  static closeOpen() {
    function closeSessions(sessions) {
      return Promise.all(
        sessions.map(session => Session.close(session))
      );
    }

    if (openingSessions === 0) {
      if (openSessions.length === 0) {
        return Promise.resolve([]);
      }

      return closeSessions(openSessions);
    }

    return new Promise((resolve, reject) => {
      emitter.on('all-open', () => {
        closeSessions(openSessions)
          .then(resolve, reject);
      });
    });
  }

}
