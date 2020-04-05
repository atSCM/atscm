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
    static _create(): Promise<any>;
    /**
     * Creates an {@link node-opcuaOPCUAClient} and opens a new  {@link node-opcua~ClientSession}. If
     * pooling is active, the shared session will be reused.
     * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with an already opened
     * {@link node-opcua~ClientSession}.
     */
    static create(): Promise<any>;
    /**
     * A promise that resolves once the shared session is created.
     * @type {Promise<node-opcua~ClientSession}
     */
    static _createShared: Promise<node>;
    /**
     * Starts pooling (reusing) sessions. Note that you'll have to manually close sessions using
     * {@link Session.closeOpen}.
     */
    static pool(): void;
    /**
     * If sessions should be reused.
     * @type {boolean}
     */
    static _pool: boolean;
    /**
     * Closes the given session. Waits for currently opening sessions to open.
     * @param {node-opcua~ClientSession} session The session to close.
     * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (now closed!) session or
     * rejected with the error that occured while closing.
     */
    static _close(session: any): Promise<any>;
    /**
     * Closes the given session. When session pooling is active the session won't actually be closed
     * and the returned Promise will resolve immediately.
     * @param {node-opcua~ClientSession} session The session to close.
     * @return {Promise<node-opcua~ClientSession, Error>} Fulfilled with the (maybe closed) session or
     * rejected with the error that occured while closing.
     */
    static close(session: any): Promise<any>;
    /**
     * The sessions currently open. Starting with version 1.0.0-beta.25 there will be one at most.
     * @type {Session[]}
     */
    static get open(): Session[];
    /**
     * Closes all open sessions.
     * @return {Promise<Error, Session[]>} Rejected with the error that occurred while closing the
     * sessions or fulfilled with the (now closed) sessions affected.
     */
    static closeOpen(): Promise<Error>;
}
