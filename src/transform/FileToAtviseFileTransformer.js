import { src } from 'gulp';
import CombinedStream from 'combined-stream';
import ProjectConfig from '../config/ProjectConfig';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from './Mapping';

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
export default class FileToAtviseFileTransformer {

  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See
   * {@link FileToAtviseFileTransformer#constructor} for available
   * options.
   * @param {Boolean} [options.applyTransformers] Defines whether transformer
   * should be applied or not
   * @param {NodeId[]} [options.nodesToTransform] The nodes to transform.
   */
  constructor(options = {}) {
    /**
     * Combined stream instance.
     * @type {CombinedStream}
     */
    const combinedSrcStream = CombinedStream.create();

    /**
     * Stream that creates atvise files.
     * @type {MappingTransformer}
     */
    const mappingStream = new MappingTransformer(
      { direction: TransformDirection.FromFilesystem }
    );

    /**
     * Stream containing all type definition files.
     * @type {NodeId[]}
     */
    const nodesToTransform = options.nodesToTransform || [];

    nodesToTransform.map(nodeId => combinedSrcStream
      .append(src(`./src/${nodeId.filePath}/**/*.*`)));

    if (options.applyTransformers !== undefined && options.applyTransformers === false) {
      return combinedSrcStream
        .pipe(mappingStream);
    }

    return Transformer.applyTransformers(
      combinedSrcStream
        .pipe(mappingStream),
      ProjectConfig.useTransformers,
      TransformDirection.FromFilesystem
    );
  }
}
