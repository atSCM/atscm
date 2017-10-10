import readline from 'readline';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import FileToAtviseFileTransformer from '../../transform/FileToAtviseFileTransformer';
import NodeFileStream from '../server/NodeFileStream';
import WriteStream from '../server/WriteStream';
import CreateNodeStream from '../server/CreateNodeStream';
import AddReferenceStream from '../server/AddReferenceStream';

/**
 * A stream that transforms read {@link vinyl~File}s and pushes them to atvise server.
 */
export default class PushStream {

  /**
   * Creates a new PushSteam based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {NodeId[]} [options.nodesToPush] The nodes to push.
   * @param {Boolean} [options.createNodes] Defines if nodes shall be created or not.
   */
  constructor(options = {}) {

    /**
     * Defines shall be created or not.
     * @type {Boolean}
     */
    const createNodes = options.createNodes || false;

    /**
     * The nodes to push
     * @type {NodeId[]}
     */
    const nodesToPush = options.nodesToPush || [];

    const fileTransformer = new FileToAtviseFileTransformer({nodesToTransform: nodesToPush});
    const nodeFileStream = new NodeFileStream({createNodes: createNodes});
    const createNodeStream = new CreateNodeStream();
    const writeStream = new WriteStream({createNodes: createNodes});

    this.printProgress = setInterval(() => {
      Logger.info(
      `Pushed: ${writeStream._processed} (${writeStream.opsPerSecond.toFixed(1)} ops/s)`
      );

      if (Logger.listenerCount('info') > 0) {
        readline.cursorTo(process.stdout, 0);
        readline.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    this.pushStream = fileTransformer.stream
      .pipe(fileTransformer.typeDefinitionFilter.restore)
      .pipe(nodeFileStream)
      .pipe(writeStream)
      .pipe(createNodeStream);

    this.pushStream.once('finish', () => {
      const atvReferenceFilter = fileTransformer.atvReferenceFilter;
      Logger.debug('Writing and creating nodes finished. Adding references...');

      if (this.createNodes && atvReferenceFilter.restore._readableState.buffer.length > 0) {
        const addReferenceStream = new AddReferenceStream();

        this.pushStream.pipe(atvReferenceFilter.restore)
          .pipe(addReferenceStream)
          .on('finish', () => this.endStream());
      } else {
        this.endStream();
      }
    });

    return this.pushStream;
  }

  /**
   * Stops the print progress when push stream has finished and stops the push task process
   */
  endStream() {
    if (Logger.listenerCount('info') > 0) {
      readline.cursorTo(process.stdout, 0);
      readline.clearLine(process.stdout);
    }

    clearInterval(this.printProgress);
  }
}