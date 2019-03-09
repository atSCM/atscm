import Emitter from 'events';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { ClientSession } from 'node-opcua/lib/client/opcua_client';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import Client from './Client';

/**
 * The currently open sessions.
 * @type {node-opcua~ClientSession[]}
 */
const openSessions = [];

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
    if (this._getShared) { return this._getShared; }

    /**
     * A promise that resolves once the shared session is created.
     * @type {Promise<node-opcua~ClientSession}
     */
    this._getShared = Client.create()
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
            Object.assign(session, { _emitter: new Emitter() });

            openSessions.push(session);

            resolve(session);
          }
        });
      }));

    return this._getShared;
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
   * Closes the given session.
   * @param {node-opcua~ClientSession} session The session to close.
   * @param {boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static _close(session, deleteSubscriptions = true) {
    delete this._getShared;

    if (!session || !(session instanceof ClientSession)) {
      return Promise.reject(new Error('session is required'));
    }

    if (session._closed) {
      return Promise.resolve();
    }

    if (session._closing) {
      return session._closing;
    }

    // eslint-disable-next-line no-param-reassign
    session._closing = new Promise((resolve, reject) => {
      function markAsClosed() {
        openSessions.splice(openSessions.indexOf(session), 1);
        Object.assign(session, { _closed: true });

        resolve(session);
        session._emitter.emit('fully-closed');
      }

      session.close(deleteSubscriptions, err => {
        if (err) {
          if (err.response &&
            err.response.responseHeader.serviceResult === StatusCodes.BadSessionIdInvalid
          ) {
            Logger.debug('Attempted to close a session that does not exist');
            markAsClosed(session);
          } else if (err.message === 'no channel') {
            // Client already disconnected
            markAsClosed(session);
          } else {
            reject(new Error(`Unable to close session: ${err.message}`));
          }
        } else {
          Client.disconnect().then(resolve, reject);
        }
      });
    });

    return session._closing;
  }

  /**
   * Closes the given session. When session pooling is active the session won't actually be closed
   * and the returned Promise will resolve immediately.
   * @param {node-opcua~ClientSession} session The session to close.
   * @param {boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static close(session, deleteSubscriptions = true) {
    if (this._pool) {
      return Promise.resolve(session);
    }

    return this._close(session, deleteSubscriptions);
  }

  /**
   * The sessions currently open. Starting with version 1.0.0-beta.25 there will be one at most.
   * @type {Session[]}
   */
  static get open() {
    return openSessions;
  }

  /**
   * Closes all open sessions.
   * @return {Promise<Error, Session[]>} Rejected with the error that occurred while closing the
   * sessions or fulfilled with the (now closed) sessions affected.
   */
  static closeOpen() {
    return Promise.all(openSessions.map(session => this._close(session)));
  }

}
