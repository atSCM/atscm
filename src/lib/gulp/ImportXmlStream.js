import {DataType, NodeClass, StatusCodes, VariantArrayType, Variant} from 'node-opcua';
import QueueStream from '../stream/QueueStream';
import NodeId from '../ua/NodeId';
import checkType from '../../util/validation';
import Logger from 'gulplog';

/**
 * Call script node id
 * @type {node-opcua~NodeId}
 */
const ImportNodesMethodId = new NodeId("ns=1;s=AGENT.OPCUA.METHODS.importNodes");

/**
 * Base node id for callscript node
 * @type {node-opcua~NodeId}
 */
const ImportNodesMethodBaseNodeId = ImportNodesMethodId.parentNodeId;


/**
 * A stream that imports xml files in parallel.
 */
export default class ImportXmlStream extends QueueStream {

  /**
   * @param {vinyl~file} file The file to create the call object for.
   * Creates the call object for the given file
   * @return {Object} The resulting call script object.
   */
  createCallObject(file) {
    return {
      objectId: ImportNodesMethodBaseNodeId.toString(),
      methodId: ImportNodesMethodId.toString(),
      inputArguments: [
        {
          dataType: DataType.NodeId,
          value: new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0) // absolute import
        },
        {
          dataType: DataType.XmlElement,
          value: file.contents
        }
      ]
    };
  }


  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~file} file The file to generate the error message for
   * @return {String} The specific error message.
   */
  processErrorMessage(file) {
    return `Error importing file: ${file.path}`;
  }


  /**
   * Performs opcua method calls for the given call object configuration
   * @param {vinyl~file} file The file being processed.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(file, handleErrors) {
    const callObj = this.createCallObject(file);

    try {
      this.session.call([callObj], (err, results) => {
        if (err) {
          handleErrors(err);
        } else if (results[0].statusCode.value != StatusCodes.Good.value) {
          handleErrors(err, results[0].statusCode, done => done());
        } else {
          const importSuccessFull = results[0].outputArguments[0].value;

          if (importSuccessFull) {
            Logger.info(`Successfully imported file: ${file.path}`);
          } else {
            Logger.error(this.processErrorMessage(file));
          }

          handleErrors(err, StatusCodes.Good, done => done());
        }
      });
    } catch (e) {
      handleErrors(e);
    }
  }
}

