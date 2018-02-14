import { DataType } from 'node-opcua';
import Logger from 'gulplog';
import NodeId from '../server/NodeId';
import CallMethodStream from '../server/scripts/CallMethodStream';

/**
 * The import operation's scope, which is set to be *absolute*.
 * @type {NodeId}
 */
const scopeId = new NodeId(NodeId.NodeIdType.NUMERIC, 0, 0);

export default class ImportStream extends CallMethodStream {

  get methodId() {
    return new NodeId('ns=1;s=AGENT.OPCUA.METHODS.importNodes');
  }

  inputArguments(file) {
    return [
      {
        dataType: DataType.NodeId,
        value: scopeId,
      },
      {
        dataType: DataType.XmlElement,
        value: file.contents,
      },
    ];
  }

  /**
   * Returns an error message specifically for the given file.
   * @param {vinyl~File} file The file to generate the error message for.
   * @return {string} The specific error message.
   */
  processErrorMessage(file) {
    return `Error importing file: ${file.relative}`;
  }

  handleOutputArguments(file, [importStatus] = [{}], callback) {
    if (importStatus.value) {
      Logger.debug(`Successfully imported file: ${file.relative}`);

      callback(null);
    } else {
      callback(new Error('Import failed'));
    }
  }

}
