import QueueStream from './QueueStream';
import { NodeClass, VariantArrayType, ReferenceTypeIds } from 'node-opcua';
import NodeConfigStreamResult from './NodeConfigStreamResult';
import Logger from 'gulplog';

/**
 * A stream that creates node configuration items from the given {@link BrowseStream.BrowseResults}s passed.
 */
export default class NodeConfigStream extends QueueStream {

  /**
   * Creates a {NodeConfigStreamResult.NodeConfigStreamResult} Objects for the given {BrowseStreamResult.BrowseStreamResult}
   * @param {BrowseStreamResult.BrowseStreamResult} browseStreamResult The browseStreamResult to process
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
