import { src } from 'gulp';
import ProjectConfig from '../config/ProjectConfig';
import filter from 'gulp-filter';
import CombinedStream from 'combined-stream';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from './Mapping';

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
export default class FileToAtviseFileTransformer {

  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See {@link FileToAtviseFileTransformer#constructor} for available
   * options.
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
    const mappingStream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });

    /**
     * Stream containing all type definition files.
     * @type {NodeId[]}
     */
    const nodesToTransform = options.nodesToTransform || [];

    /**
     * Stream containing all type definition files.
     * @type {Stream}
     */
    this.typeDefinitionFilter = filter(file => !file.isTypeDefinition, { restore: true });

    /**
     * Stream containing all atvise Reference files.
     * @type {Stream}
     */
    this.atvReferenceFilter = filter(file => !file.isAtviseReferenceConfig, { restore: true });

    nodesToTransform.map(nodeId => combinedSrcStream.append(src(`./src/${nodeId.filePath}/**/*.*`)));

    /**
     * Stream containing all atvise content files.
     * @type {Stream}
     */
    this.stream = Transformer.applyTransformers(
      combinedSrcStream
        .pipe(mappingStream)
        .pipe(this.typeDefinitionFilter)
        .pipe(this.atvReferenceFilter),
      ProjectConfig.useTransformers,
      TransformDirection.FromFilesystem
    )
  }
}