'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Client = require('./Client');

var _Client2 = _interopRequireDefault(_Client);

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
          resolve(session);
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

    return new Promise((resolve, reject) => {
      session.close(deleteSubscriptions, err => {
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
exports.default = Session;