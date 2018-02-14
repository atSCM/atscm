import { DataType, StatusCodes } from 'node-opcua';
import Logger from 'gulplog';
import QueueStream from '../server/QueueStream';
import NodeId from '../server/NodeId';

/**
 * Call script node id
 * @type {NodeId}
 */
const methodId = new NodeId('ns=1;s=AGENT.OPCUA.METHODS.importNodes');

/**
 * Base node id for callscript node
 * @type {NodeId}
 */
const methodBaseId = methodId.parent;

/**
 * The import operation's scope, which is set to be *absolute*.
 * @type {NodeId}
 */
const scopeId = new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0);

/**
 * The call object that is used for all calls.
 * @type {Object}
 */
const baseCallObject = {
  objectId: methodBaseId.toString(),
  methodId: methodId.toString(),
  inputArguments: [
    {
      dataType: DataType.NodeId,
      value: scopeId,
    },
  ],
};

/**
 * A stream that imports xml files in parallel.
 */
export default class ImportStream extends QueueStream {

  /**
   * @param {vinyl~file} file The file to create the call object for.
   * Creates the call object for the given file.
   * @return {Object} The resulting call script object.
   */
  createCallObject(file) {
    return Object.assign({}, baseCallObject, {
      inputArguments: baseCallObject.inputArguments
        .concat({
          dataType: DataType.XmlElement,
          value: file.contents,
        }),
    });
  }

  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~file} file The file to generate the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(file) {
    return `Error importing file: ${file.relative}`;
  }

  /**
   * Performs opcua method calls for the given call object configuration.
   * @param {vinyl~file} file The file being processed.
   * @param {function(err: Error, status: node-opcua~StatusCodes, success: function)} handleErrors
   * The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    const callObj = this.createCallObject(file);

    try {
      this.session.call([callObj], (err, [result] = []) => {
        if (err) {
          handleErrors(err);
        } else if (result.statusCode.value !== StatusCodes.Good.value) {
          handleErrors(err, result.statusCode, done => done());
        } else {
          const importSuccessFull = result.outputArguments[0].value;

          if (importSuccessFull) {
            Logger.debug(`Successfully imported file: ${file.path}`);

            handleErrors(null, StatusCodes.Good, done => done());
          } else {
            handleErrors(new Error('No success'), StatusCodes.Good, done => done());
          }
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }

}
