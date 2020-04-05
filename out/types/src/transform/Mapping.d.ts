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
    _readReferenceFiles: Object;
    /**
     * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read. If a read file has a
     * non-standard type (definition) an additional `rc` file is pushed holding this type.
     * @param {Node} node The read result to create the file for.
     * @param {string} encoding The encoding used.
     * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
     * while transforming the read result or the resulting file.
     */
    transformFromDB(node: any, encoding: string, callback: (arg0: any, arg1: Error, arg2: any, arg3: any) => any): void;
    /**
     * Writes an {@link AtviseFile} for each {@link Node} read.
     * @param {Node} node The raw file.
     * @param {string} encoding The encoding used.
     * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
     * while transforming the read result or the resulting file.
     */
    transformFromFilesystem(node: any, encoding: string, callback: (arg0: any, arg1: Error, arg2: any, arg3: any) => any): any;
    /**
     * `true` as the mapping transformer should infer references from config files.
     */
    get transformsReferenceConfigFiles(): boolean;
}
import Transformer from "../lib/transform/Transformer";
