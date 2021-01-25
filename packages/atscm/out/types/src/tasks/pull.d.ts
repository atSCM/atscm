/**
 * Pulls the given nodes from the server.
 * @param {NodeId[]} nodes The nodes to pull from the server.
 * @param {Object} options Options passed to {@link NodeBrowser}.
 */
export function performPull(nodes: any[], options?: any): Promise<void> & {
    browser: NodeBrowser;
};
/**
 * Pulls all nodes from atvise server.
 * @param {Object} [options] The options to use.
 * @param {boolean} [options.clean] If the source directory should be cleaned first.
 */
declare function pull(options?: {
    clean: boolean;
}): Promise<void>;
declare namespace pull {
    export const description: string;
}
export default pull;
import NodeBrowser from "../lib/server/NodeBrowser";
