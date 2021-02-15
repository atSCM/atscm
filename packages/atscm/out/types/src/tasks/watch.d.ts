/**
 * The gulp task invoced when running `atscm watch`.
 * @param {Object} options The options to pass to the watch task, see {@link WatchTask#run} for
 * available options.
 * @return {Promise<{ serverWatcher: Watcher, fileWatcher: sane~Watcher }, Error>} Fulfilled once
 * all watchers are set up and Browsersync was initialized.
 */
declare function watch(options: any): Promise<{
    serverWatcher: any;
    fileWatcher: any;
}>;
declare namespace watch {
    export const description: string;
}
export default watch;
/**
 * The task executed when running `atscm watch`.
 */
export class WatchTask {
    /**
     * The Browsersync instance used.
     * @type {events~Emitter}
     */
    browserSyncInstance: any;
    /**
     * If the task is currently pulling.
     * @type {boolean}
     */
    _pulling: boolean;
    /**
     * If the task is currently pushing.
     * @type {boolean}
     */
    _pushing: boolean;
    /**
     * Timestamp of the last pull
     * @type {number}
     */
    _lastPull: number;
    /**
     * The {@link NodeId} of the last push.
     * @type {?NodeId}
     */
    _lastPushed: any;
    /**
     * The directory to watch.
     * @type {string}
     */
    get directoryToWatch(): string;
    /**
     * Waits for a watcher (which can actually be any kind of {@link events~Emitter}) to emit a
     * "ready" event.
     * @param {events~Emitter} watcher The watcher to wait for.
     * @return {Promise<events~Emitter, Error>} Fulfilled with the set up watcher or rejected with the
     * watcher error that occurred while waiting for it to get ready.
     */
    _waitForWatcher(watcher: any): Promise<any>;
    /**
     * Starts a file watcher for the directory {@link WatchTask#directoryToWatch}.
     * @return {Promise<sane~Watcher, Error>} Fulfilled with the file watcher once it is ready or
     * rejected with the error that occurred while starting the watcher.
     */
    startFileWatcher(): Promise<any>;
    /**
     * Starts a watcher that watches the atvise server for changes.
     * @return {Promise<Watcher, Error>} Fulfilled with the server watcher once it is ready or
     * rejected with the error that occurred while starting the watcher.
     */
    startServerWatcher(): Promise<any, Error>;
    /**
     * Initializes {@link WatchTask#browserSyncInstance}.
     * @param {Object} options The options to pass to browsersync.
     * @see https://browsersync.io/docs/options
     */
    initBrowserSync(options: any): void;
    /**
     * Prints an error that happened while handling a change.
     * @param {string} contextMessage Describes the currently run action.
     * @param {Error} err The error that occured.
     */
    printTaskError(contextMessage: string, err: Error): void;
    /**
     * Handles a file change.
     * @param {string} path The path of the file that changed.
     * @param {string} root The root of the file that changed.
     * @return {Promise<boolean>} Resolved with `true` if the change triggered a push operation,
     * with `false` otherwise.
     */
    handleFileChange(path: string, root: string): Promise<boolean>;
    _handlingChange: boolean;
    /**
     * Handles an atvise server change.
     * @param {ReadStream.ReadResult} readResult The read result of the modification.
     * @return {Promise<boolean>} Resolved with `true` if the change triggered a pull operation,
     * with `false` otherwise.
     */
    handleServerChange(readResult: ReadStream.ReadResult): Promise<boolean>;
    /**
     * Starts the file and server watchers, initializes Browsersync and registers change event
     * handlers.
     * @param {Object} [options] The options to pass to browsersync.
     * @param {boolean} [options.open=true] If the browser should be opened once browsersync is up.
     * @return {Promise<{ serverWatcher: Watcher, fileWatcher: sane~Watcher }, Error>} Fulfilled once
     * all watchers are set up and Browsersync was initialized.
     */
    run({ open }?: {
        open: boolean;
    }): Promise<{
        serverWatcher: any;
        fileWatcher: any;
    }>;
}
