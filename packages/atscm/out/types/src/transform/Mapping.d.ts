/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
export default class MappingTransformer extends Transformer {
    /**
     * Creates a new mapping transformer.
     * @param {Object} [options] The arguments passed to the {@link Transformer} constructor.
     */
    constructor(options?: any);
    /**
     * Contents of the reference files read but not used yet.
     * @type {Object}
     */
    _readReferenceFiles: any;
    /**
     * `true` as the mapping transformer should infer references from config files.
     */
    get transformsReferenceConfigFiles(): boolean;
}
import Transformer from "../lib/transform/Transformer";
