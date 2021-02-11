/**
 * Pushes the given path to the server.
 * @param {string} path The local path to push.
 * @param {Object} options Options passed to {@link src}.
 */
export function performPush(path: string, options: any): Promise<void> & {
    browser: import("../lib/gulp/src").SourceBrowser;
};
/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
declare function push(): Promise<void>;
declare namespace push {
    export const description: string;
}
export default push;
