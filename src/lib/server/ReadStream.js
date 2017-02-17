import { StatusCodes } from 'node-opcua';
import Stream from './Stream';

/**
 * An object transform stream that reads the written {@link NodeId}s.
 */
export default class ReadStream extends Stream {

  /**
   * Reads the given node.
   * @param {NodeId} nodeId The node to browse.
   * @param {function(err: ?Error, data: ?Object)} callback Called with the error that occurred, or
   * otherwise with the read results.
   */
  readNode(nodeId, callback) {
    this.session.read([{ nodeId }], (err, nodesToRead, results) => {
      if (err) {
        callback(new Error(`Reading ${nodeId.toString()} failed: ${err.message}`));
      } else if (!results || results.length === 0) {
        callback(new Error(`Reading ${nodeId.toString()} failed: No results`));
      } else if (results[0].statusCode !== StatusCodes.Good) {
        callback(new Error(`Reading ${nodeId.toString()} failed: Status ${results[0].statusCode}`));
      } else {
        callback(null, {
          nodeId,
          value: results[0].value,
        });
      }
    });
  }

  /**
   * Calls {@link ReadStream#readNode} once the session is open for the passed node.
   * @param {NodeId} nodeId The node to read.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?Object)} callback Called by {@link ReadStream#readNode}
   * once reading ended.
   * @listens {Session} Listens to the `session-open`-event if the session is not open yet.
   */
  _transform(nodeId, enc, callback) {
    if (this.session) {
      this.readNode(nodeId, callback);
    } else {
      this.once('session-open', () => this.readNode(nodeId, callback));
    }
  }

}
