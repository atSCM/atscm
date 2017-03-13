'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodeOpcua = require('node-opcua');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Client = require('./Client');

var _Client2 = _interopRequireDefault(_Client);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const emitter = new _events2.default();
const openSessions = [];
let openingSessions = 0;

/**
 * A wrapper around {@link node-opcua~ClientSession} used to connect to atvise server.
 */
class Session {

  /**
   * Creates and opens a new {@link node-opcua~ClientSession}.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
   * {@link node-opcua~ClientSession}.
   */
  static create() {
    return _Client2.default.create().then(client => new Promise((resolve, reject) => {
      openingSessions++;

      client.createSession({
        userName: _ProjectConfig2.default.login.username,
        password: _ProjectConfig2.default.login.password
      }, (err, session) => {
        if (err) {
          if (['userName === null || typeof userName === "string"', 'password === null || typeof password === "string"'].includes(err.message) || err.response && err.response.responseHeader.serviceResult === _nodeOpcua.StatusCodes.BadUserAccessDenied) {
            reject(new Error('Unable to create session: Invalid login'));
          } else {
            reject(new Error(`Unable to create session: ${err.message}`));
          }
        } else {
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
   * @param {Boolean} [deleteSubscriptions=true] If active subscriptions should be closed as well.
   * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
   * rejected with the error that occured while closing.
   */
  static close(session, deleteSubscriptions = true) {
    if (!session || !(session instanceof _nodeOpcua.ClientSession)) {
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
      function removeOpenSession(sess) {
        openSessions.splice(openSessions.indexOf(sess), 1);
      }

      session.close(deleteSubscriptions, err => {
        if (err) {
          if (err.response.responseHeader.serviceResult === _nodeOpcua.StatusCodes.BadSessionIdInvalid) {
            removeOpenSession(session);
            _gulplog2.default.debug('Attempted to close a session that does not exist');
            resolve(session);
          } else if (err.message === 'no channel') {
            removeOpenSession(session);
            resolve(session);
          } else {
            reject(new Error(`Unable to close session: ${err.message}`));
          }
        } else {
          session._client.disconnect(clientErr => {
            if (clientErr) {
              reject(new Error(`Unable to disconnect client: ${clientErr.message}`));
            } else {
              removeOpenSession(session);

              Object.assign(session, { _closed: true });
              resolve(session);
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
      emitter.on('all-open', () => {
        closeSessions(openSessions).then(resolve, reject);
      });
    });
  }

}
exports.default = Session;