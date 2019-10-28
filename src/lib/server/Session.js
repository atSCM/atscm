import { join } from 'path';
import Emitter from 'events';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { OPCUAClient, ClientSession } from 'node-opcua/lib/client/opcua_client';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import { promisified } from '../helpers/async';

/**
 * The currently open sessions.
 * @type {Set<node-opcua~ClientSession>}
 */
const openSessions = new Set();

/**
 * The sessions currentyl being opened.
 * @type {Set<node-opcua~ClientSession>}
 */
const openingSessions = new Set();

/**
 * A wrapper around {@link node-opcua~ClientSession} used to connect to atvise server.
 * The sessions currentyl being opened.
 * @type {Set<node-opcua~ClientSession>}
 */
export default class Session {

  /**
   * Creates an {@link node-opcuaOPCUAClient} and opens a new  {@link node-opcua~ClientSession}.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
   * {@link node-opcua~ClientSession}.
   */
  static async _create() {
    const client = new OPCUAClient({
      requestedSessionTimeout: 600000,
      keepSessionAlive: true,
      certificateFile: join(__dirname, '../../../res/certificates/certificate.pem'),
      privateKeyFile: join(__dirname, '../../../res/certificates/key.pem'),
    });

    const endpoint = `opc.tcp://${ProjectConfig.host}:${ProjectConfig.port.opc}`;

    const timer = setTimeout(() => {
      Logger.warn(`It takes unusually long to connect to the atvise server at ${endpoint}.
 - Are you sure it is running?`);
    }, ProjectConfig.timeout);

    await promisified(cb => client.connect(endpoint, cb));
    Logger.debug(`Connected to ${endpoint}`);
    clearTimeout(timer);

    const session = await promisified(cb => client.createSession({
      userName: ProjectConfig.login.username,
      password: ProjectConfig.login.password,
    }, cb))
      .catch(err => {
        if (
          [
            'userName === null || typeof userName === "string"',
            'password === null || typeof password === "string"',
          ].includes(err.message) ||
          (err.response &&
          err.response.responseHeader.serviceResult === StatusCodes.BadUserAccessDenied)
        ) {
          throw new Error('Unable to create session: Invalid login');
        }

        throw err;
      });

    openSessions.add(session);
    return Object.assign(session, { _emitter: new Emitter() });
  }

  /**
   * Creates an {@link node-opcuaOPCUAClient} and opens a new  {@link node-opcua~ClientSession}. If
   * pooling is active, the shared session will be reused.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
   * {@link node-opcua~ClientSession}.
   */
  static create() {
    const create = () => {
      const c = this._create();
      openingSessions.add(c);

      return c.then(s => openingSessions.delete(c) && s);
    };

    if (!this._pool) {
      return create();
    }

    if (!this._createShared) {
      /**
       * A promise that resolves once the shared session is created.
       * @type {Promise<node-opcua~ClientSession}
       */
      this._createShared = create();
    }

    return this._createShared;
  }

  // eslint-disable-next-line jsdoc/require-description-complete-sentence
  /**
   * Starts pooling (reusing) sessions. Note that you'll have to manually close sessions using
   * {@link Session.closeOpen}.
   */
  static pool() {
    /**
     * If sessions should be reused.
     * @type {boolean}
     */
    this._pool = true;
  }

  /**
   * Closes the given session. Waits for currently opening sessions to open.
   * @param {node-opcua~ClientSession} session The session to close.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static async _close(session) {
    openSessions.delete(session);

    await new Promise(resolve => session.close(true, () => resolve()));
    await new Promise(resolve => session._client && session._client.disconnect(() => resolve()));

    return session;
  }

  /**
   * Closes the given session. When session pooling is active the session won't actually be closed
   * and the returned Promise will resolve immediately.
   * @param {node-opcua~ClientSession} session The session to close.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (maybe closed) session or
   * rejected with the error that occured while closing.
   */
  static close(session) {
    if (!session || !(session instanceof ClientSession)) {
      return Promise.reject(new Error('session is required'));
    }

    if (this._pool) { return Promise.resolve(); }

    return this._close(session);
  }

  /**
   * The sessions currently open. Starting with version 1.0.0-beta.25 there will be one at most.
   * @type {Session[]}
   */
  static get open() {
    return Array.from(openSessions);
  }

  /**
   * Closes all open sessions.
   * @return {Promise<Error, Session[]>} Rejected with the error that occurred while closing the
   * sessions or fulfilled with the (now closed) sessions affected.
   */
  static async closeOpen() {
    await Promise.all(openingSessions);

    return Promise.all(
      Array.from(openSessions).map(session => this._close(session))
    );
  }

}
