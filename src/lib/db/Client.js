import { OPCUAClient } from 'node-opcua';
import ProjectConfig from '../../config/ProjectConfig';
import Session from './Session';

/**
 * A wrapper around node-opcua's {@link NodeOpcua.OPCUAClient} class. The client is automatically
 * disconnect when all sessions are closed.
 * @abstract
 */
export class _Client extends OPCUAClient {

  /**
   * Creates a new Client with the given options.
   * @param {Object} options The options to apply.
   * @see http://node-opcua.github.io/api_doc/classes/OPCUAClient.html
   */
  constructor(options) {
    super(options);

    /**
     * `true` if the client is currently connecting to an endpoint.
     * @type {Boolean}
     */
    this.isConnecting = false;

    /**
     * `true` if the client is connected to an endpoint.
     * @type {boolean}
     */
    this.connected = false;
  }

  /**
   * Connects the client to the given endpoint.
   * @param {String} endpointUrl The URL to connect to.
   * @return {Promise<_Client, Error>} Resolved with the connected client or rejected with the
   * connection error.
   * @emits {Event} Emits a `connect` event after a connection was establised.
   * @emits {Event} Emits a `connect-fail` event if a connection could not be established.
   */
  connect(endpointUrl) {
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      super.connect(endpointUrl, err => {
        if (err) {
          reject(err);
          this.emit('connect-fail');
        } else {
          this.connected = true;
          resolve(this);
          this.emit('connect');
        }

        this.isConnecting = false;
      });
    });
  }

  /**
   * Disconnects the client from it's endpoint
   * @return {Promise<_Client>} Resolved with the (now disconnected) client.
   */
  disconnect() {
    this.connected = false;

    return new Promise(resolve => {
      super.disconnect(() => {
        resolve(this);
      });
    });
  }

  /**
   * Creates a new {@link Session} for the client.
   * @return {Promise<Session, Error>} Resolved with the newly created session, rejected with an
   * error if creating the session failed.
   */
  createSession() {
    if (!this.connected) {
      return Promise.reject(new Error('Client is not connected'));
    }

    return new Promise((resolve, reject) => {
      super.createSession({
        userName: ProjectConfig.login.username,
        password: ProjectConfig.login.password,
      }, (err, session) => {
        if (err) {
          reject(err);
        } else {
          // "Cast" to Session
          Object.setPrototypeOf(session, Session.prototype);

          resolve(session);
        }
      });
    });
  }

  /**
   * Internal: Called after a session was closed.
   * @param {Session} session The session being removed.
   * @ignore
   */
  _removeSession(session) {
    super._removeSession(session);

    if (!this.hasSession) {
      this.disconnect();
    }
  }

  /**
   * `true` if the client has at least one active session.
   * @type {Boolean}
   */
  get hasSession() {
    return this._sessions.length > 0;
  }

}

// The shared client instance
let client = null;

/**
 * A singleton wrapper around node-opcua's {@link NodeOpcua.OPCUAClient class.
 *
 * @example <caption>Get the shared instance</caption>
 * Client.shared()
 *   .then(client => {
 *     // do something with `client`
 *   });
 */
export default class Client extends _Client {

  /**
   * **Should never be called directly.** Use {@link Client.shared} instead.
   */
  constructor() {
    throw new Error('Client is not meant to be instantiated. Use Client.shared instead');
  }

  /**
   * Returns the shared client instance connected to the host specified in the project
   * configuration.
   * @return {Promise<Client, Error>} Resolved with the shared client, rejected if unable to
   * connect.
   */
  static shared() {
    if (client) {
      if (client.isConnecting) {
        return new Promise((resolve, reject) => {
          client.once('connect-fail', () => reject(client));
          client.once('connect', () => resolve(client));
        });
      }

      if (client.connected) {
        return Promise.resolve(client);
      }
    }

    // Shared client was not created yet, not connected yet or disconnected
    // => create a new instance

    return (client = new _Client({
      // TODO: Insert options
    }))
      .connect(`opc.tcp://${ProjectConfig.host}:${ProjectConfig.port.opc}`);
  }

}
