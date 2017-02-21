'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _through = require('through2');

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A wrapper around object transform streams that access atvise server.
 * @abstract
 */
class Stream extends (0, _through.ctor)({ objectMode: true }) {

  /**
   * Creates a new Stream with some args to pass to the stream action. Also creates and opens a new
   * {@link Session} for the stream to use. This session is closed when the stream ends.
   * @param {...*} args The arguments to pass to {@link Stream#runWithSession}.
   */
  constructor(...args) {
    super(...args);

    /**
     * The atvise server session to use.
     * @type {?Session}
     */
    this.session = null;

    this.on('end', () => this.session.close());

    _Session2.default.create().then(session => this.session = session).then(() => this.emit('session-open')).then(() => this.runWithSession(this.session, ...args)).catch(err => {
      this.emit('error', err);
      this.end();
    });
  }

  /**
   * The action to invoke once the atvise server session is opened.
   * @param {Session} session The session to run the action with
   * @param {...*} args The args passed.
   * @return {Promise<*, Error>} Should be resolved if the action fails or rejected with the error
   * that occured.
   */
  runWithSession(session, ...args) {
    // eslint-disable-line no-unused-vars
    return Promise.resolve();
  }

  /**
   * Called on data one the session is opened. Defaults to PassThrough stream.
   * @param {*} chunk The chunk to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: Error)} callback Callback called once transformation is complete.
   */
  transformWithSession(chunk, enc, callback) {
    callback(null, chunk);
  }

  /**
   * The stream's transform function. It calls {@link Stream#transformWithSession} as soon as the
   * session is opened.
   * @param {*} chunk The chunk to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: Error)} callback Callback called once transformation is complete.
   */
  _transform(chunk, enc, callback) {
    if (this.session) {
      this.transformWithSession(chunk, enc, callback);
    } else {
      this.once('session-open', () => this.transformWithSession(chunk, enc, callback));
    }
  }

}
exports.default = Stream;