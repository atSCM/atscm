import { src } from 'gulp';
import ProjectConfig from '../config/ProjectConfig';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from './Mapping';
import BrowseStream from '../lib/server/BrowseStream';
import ReadStream from '../lib/server/ReadStream';

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
export default class UaNodeToAtviseFileTransformer {

  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See {@link FileToAtviseFileTransformer#constructor} for available
   * options.
   * @param {NodeId[]} [options.nodesToTransform] The nodes to transform.
   * @param {Boolean} [options.useInputStream] Defines if the given input stream should be used for mapping.
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
    const mappingStream = new MappingTransformer({ direction: TransformDirection.FromDB});

    /**
     * Defines if the given input stream should be used for mapping
     * @type {MappingTransformer}
     */
    const useInputStream = options.useInputStream || false;

    /**
     * Stream to use as input for mapping stream.
     * @type {Stream}
     */
    let inputStream = null;

    /**
     * Stream that reads atvise server nodes.
     * @type {ReadStream}
     */
    this.readStream = new ReadStream();


    if (useInputStream) {
      if(!options.inputStream) {
        throw new Error('UaNodeToAtviseFileTransformer#constructor: Input stream is missing')
      } else {
        inputStream = options.inputStream;
      }
    } else {
      inputStream = (new BrowseStream(nodesToTransform))
        .pipe(this.readStream)
    }

    return Transformer.applyTransformers(
      inputStream.pipe(mappingStream),
      ProjectConfig.useTransformers,
      TransformDirection.FromDB
    );
  }
}