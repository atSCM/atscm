import { ctor as throughStreamClass } from 'through2';
import Session from './Session';

/**
 * An object transform stream connected to atvise server.
 */
export default class Stream extends throughStreamClass({ objectMode: true }) {

  /**
   * Creates a new Stream and starts opening a new session to atvise server.
   * @emits {Session} Emits an `session-open` event once the session is open, passing the Session
   * instance.
   */
  constructor() {
    super();

    Session.create()
      .then(session => (this.session = session))
      .then(session => this.emit('session-open', session))
      .catch(err => this.emit('error', err));
  }

  /**
   * Called just before the stream is closed: Closes the open session.
   * @param {function(err: ?Error, data: Object)} callback Called once the session is closed.
   */
  _flush(callback) {
    if (this.session) {
      Session.close(this.session)
        .then(() => callback())
        .catch(err => callback(err));
    } else {
      callback();
    }
  }

}
