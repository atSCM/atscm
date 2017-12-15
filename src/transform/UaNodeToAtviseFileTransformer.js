import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from './Mapping';
import BrowseStream from '../lib/pull/BrowseStream';
import ReadStream from '../lib/pull/ReadStream';
import ScriptTransformer from './DisplayTransformer';
import DisplayTransformer from './ScriptTransformer';

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
export default class UaNodeToAtviseFileTransformer {
  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See
   * {@link FileToAtviseFileTransformer#constructor} for available options.
   * @param {NodeId[]} [options.nodesToTransform] The nodes to transform.
   * @param {Boolean} [options.useInputStream] Defines if the given input stream should be
   * used for mapping.
   * @param {Stream} [options.inputStream] The input stream to use.
   */
  constructor(options = {}) {
    /**
     * Stream containing all type definition files.
     * @type {NodeId[]}
     */
    const nodesToTransform = options.nodesToTransform || [];

    /**
     * Stream that creates atvise files.
     * @type {MappingTransformer}
     */
    const mappingStream = new MappingTransformer({ direction: TransformDirection.FromDB });

    /**
     * Defines if the given input stream should be used for mapping
     * @type {MappingTransformer}
     */
    const useInputStream = options.useInputStream || false;

    /**
     * The streams to apply.
     * @type {Transformer[]}
     */
    const applyTransformers = [
      new DisplayTransformer(),
      new ScriptTransformer()
    ];

    /**
     * The resulting output stream
     * @type {Stream}
     */
    this.outStream = null;

    /**
     * Stream that reads atvise server nodes.
     * @type {ReadStream}
     */
    this.readNodeStream = new ReadStream();

    if (useInputStream) {
      if (!options.inputStream) {
        throw new Error('UaNodeToAtviseFileTransformer#constructor: Input stream is missing');
      } else {
        this.outStream = options.inputStream;
      }
    } else {
      this.outStream = (new BrowseStream(nodesToTransform))
        .pipe(this.readNodeStream);
    }

    this.outStream = Transformer.applyTransformers(
      this.outStream
        .pipe(mappingStream),
      applyTransformers,
      TransformDirection.FromDB
    );
  }

  /**
   * The used {ReadStream}
   * @type {ReadStream}
   */
  get readStream () {
    return this.readNodeStream;
  }

  /**
   * The resulting output stream
   * @type {Stream}
   */
  get stream () {
    return this.outStream;
  }
}


