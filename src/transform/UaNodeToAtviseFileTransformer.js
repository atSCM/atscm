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
     * Stream that reads atvise server nodes.
     * @type {ReadStream}
     */
    this.readStream = new ReadStream();


    /**
     * Stream containing atvise files.
     * @type {Stream}
     */
    this.stream = Transformer.applyTransformers(
      (new BrowseStream(nodesToTransform))
        .pipe(this.readStream)
        .pipe(mappingStream),
      ProjectConfig.useTransformers,
      TransformDirection.FromDB
    );
  }
}