/**
 * An object transform stream connected to atvise server.
 */
export default class Stream {
    /**
     * Creates a new Stream and starts opening a new session to atvise server.
     * @param {Object} [options] The options to use. See the through2 documentation for details.
     * @param {boolean} [options.keepSessionAlive=false] If the ativse server session should be closed
     * one the stream ends.
     * @emits {Session} Emits an `session-open` event once the session is open, passing the Session
     * instance.
     * @see https://github.Com/rvagg/through2#options
     */
    constructor(options?: {
        keepSessionAlive?: boolean;
    });
    /**
     * `true` if the stream's atvise server session should be kept alive once the stream ends.
     * @type {Boolean}
     */
    _keepSessionAlive: Boolean;
    session: any;
    /**
     * Called just before the stream is closed: Closes the open session.
     * @param {function(err: ?Error, data: Object)} callback Called once the session is closed.
     */
    _flush(callback: (arg0: any, arg1: Error, arg2: any, arg3: any) => any): void;
}
