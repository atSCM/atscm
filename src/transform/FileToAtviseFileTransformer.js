import { src } from 'gulp';
import CombinedStream from 'combined-stream';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import MappingTransformer from './Mapping';
import ScriptTransformer from './DisplayTransformer';
import DisplayTransformer from './ScriptTransformer';

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
     * The resulting stream.
     * @type {Stream}
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
    /**
     * The streams to apply.
     * @type {Transformer[]}
     */
    const applyTransformers = [
      new DisplayTransformer(),
      new ScriptTransformer()
    ];

    if (options.applyTransformers !== undefined && options.applyTransformers === false) {
      return combinedSrcStream
        .pipe(mappingStream);
    }

    return Transformer.applyTransformers(
      combinedSrcStream
          .pipe(mappingStream),
        applyTransformers,
        TransformDirection.FromFilesystem
      );
    }
}
