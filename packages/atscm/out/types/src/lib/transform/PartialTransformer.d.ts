/**
 * A transformer that transforms only some of the files read.
 * @abstract
 * @example <caption>Minimum implementation</caption>
 * class MyTransformer extends PartialTransformer {
 *   shouldBeTransformed(node) {
 *     return true; // or false
 *   }
 *   transformFromFilesystem(state, context) {
 *     if (!this.shouldBeTransformed(state.node)) { return; }
 *
 *     // Apply actual transformation
 *   }
 * }
 */
export default class ModernPartialTransformer extends Transformer {
    constructor({ direction }?: {
        direction?: {
            FromDB: string;
            FromFilesystem: string;
        };
    });
    /**
     * `true` if `file` should be transformed.
     * @param {AtviseFile} file The file to transform or not.
     * @return {boolean}
     * @abstract
     */
    shouldBeTransformed(file: any): boolean;
}
import Transformer from "./Transformer";
