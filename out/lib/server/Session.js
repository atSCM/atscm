"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = _interopRequireDefault(require("events"));

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _opcua_client = require("node-opcua/lib/client/opcua_client");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _Client = _interopRequireDefault(require("./Client"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The global EventEmitter used to emit events.
 * @type {events~Emitter}
 */
const emitter = new _events.default();
/**
 * The currently open sessions.
 * @type {node-opcua~ClientSession[]}
 */

const openSessions = [];
/**
 * The number of session currently being opened.
 * @type {Number}
 */

let openingSessions = 0;
/**
 * A wrapper around {@link node-opcua~ClientSession} used to connect to atvise server.
 */

class Session {
  /**
   * An {@link events~Emitter} that emits events when creating / closing sessions.
   * @type {events~Emitter}
   */
  static get emitter() {
    return emitter;
  }
  /**
   * Creates and opens a new {@link node-opcua~ClientSession}.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
   * {@link node-opcua~ClientSession}.
   * @emits {undefined} Emits an `all-open` event once all opening sessions are open.
   */


  static create() {
    openingSessions++;
    return _Client.default.create().then(client => new Promise((resolve, reject) => {
      client.createSession({
        userName: _ProjectConfig.default.login.username,
        password: _ProjectConfig.default.login.password
      }, (err, session) => {
        if (err) {
          if (['userName === null || typeof userName === "string"', 'password === null || typeof password === "string"'].includes(err.message) || err.response && err.response.responseHeader.serviceResult === _opcua_status_code.StatusCodes.BadUserAccessDenied) {
            reject(new Error('Unable to create session: Invalid login'));
          } else {
            reject(new Error(`Unable to create session: ${err.message}`));
          }
        } else {
          Object.assign(session, {
            _emitter: new _events.default()
          });
          openSessions.push(session);
          resolve(session);
        }

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
   * @param {boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */


  static close(session, deleteSubscriptions = true) {
    if (!session || !(session instanceof _opcua_client.ClientSession)) {
      return Promise.reject(new Error('session is required'));
    }

    if (session._closed) {
      return Promise.resolve();
    }

    if (session._closing) {
      return new Promise(resolve => {
        session._emitter.on('fully-closed', () => resolve(session));
      });
    }

    Object.assign(session, {
      _closing: true
    });
    return new Promise((resolve, reject) => {
      function markAsClosed() {
        openSessions.splice(openSessions.indexOf(session), 1);
        Object.assign(session, {
          _closed: true
        });
        resolve(session);

        session._emitter.emit('fully-closed');
      }

      session.close(deleteSubscriptions, err => {
        if (err) {
          if (err.response && err.response.responseHeader.serviceResult === _opcua_status_code.StatusCodes.BadSessionIdInvalid) {
            _gulplog.default.debug('Attempted to close a session that does not exist');

            markAsClosed(session);
          } else if (err.message === 'no channel') {
            // Client already disconnected
            markAsClosed(session);
          } else {
            reject(new Error(`Unable to close session: ${err.message}`));
          }
        } else {
          session._client.disconnect(clientErr => {
            if (clientErr) {
              reject(new Error(`Unable to disconnect client: ${clientErr.message}`));
            } else {
              markAsClosed(session);
            }
          });
        }
      });
    });
  }
  /**
   * The sessions currently open.
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
    function closeSessions(sessions) {
      return Promise.all(sessions.map(session => Session.close(session)));
    }

    if (openingSessions === 0) {
      if (openSessions.length === 0) {
        return Promise.resolve([]);
      }

      return closeSessions(openSessions);
    }

    return new Promise((resolve, reject) => {
      emitter.once('all-open', () => {
        closeSessions(openSessions).then(resolve, reject);
      });
    });
  }

}

exports.default = Session;
//# sourceMappingURL=Session.js.map