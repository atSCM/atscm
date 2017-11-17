import QueueStream from './QueueStream';
import NodeConfigStreamResult from './NodeConfigStreamResult';

/**
 * A stream that creates node configuration items from the given {@link BrowseStreamResult}s passed.
 */
export default class NodeConfigStream extends QueueStream {

  /**
   * Creates a {@link NodeConfigStreamResult} Objects for the given {@link BrowseStreamResult}.
   * @param {BrowseStreamResult} browseStreamResult The browseStreamResult to process.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  _processChunk(browseStreamResult) {
    const nodeConfigStreamResult = new NodeConfigStreamResult(browseStreamResult);

    this._processed++;
    this.push(nodeConfigStreamResult);
    this._processNextChunk(nodeConfigStreamResult);
  }
}
