'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Client = require('./Client');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A wrapper around node-opcua's {@link NodeOpcua.ClientSession}.
 */
class Session extends _nodeOpcua.ClientSession {

  /**
   * **Should never be called directly.** Use {@link Session.create} instead.
   */
  constructor() {
    throw new Error('Session is not meant to be instantiated directly. Use Session.create instead');
  }

  /**
   * Closes the session. **Note that, if this is the last open session for the shared {@link Client}
   * instance, the session's client is also disconnected.**
   * @param {Boolean} [deleteSubscription=true] If subscriptions should be deleted as well.
   * @return {Promise<Session, Error>} Resolved with the (now closed) Session or the error that
   * occured while closing.
   */
  close(deleteSubscription = true) {
    return new Promise((resolve, reject) => {
      super.close(deleteSubscription, err => {
        if (err) {
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  /**
   * Creates a new Session for the shared {@link Client} instance. Creates and connects a new
   * {@link Client} instance as well if no shared one exists.
   * @return {Promise<Session, Error>} Resolves with the new Session or the Error that occurred
   * while connecting the shared {@link Client} or creating the session.
   */
  static create() {
    return _Client2.default.shared().then(client => client.createSession());
  }

}
exports.default = Session;