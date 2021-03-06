import Transformer from './Transformer';

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
  /**
   * `true` if `file` should be transformed.
   * @param {AtviseFile} file The file to transform or not.
   * @return {boolean}
   * @abstract
   */
  // eslint-disable-next-line no-unused-vars
  shouldBeTransformed(file) {
    throw new Error('PartialTransformer#shouldBeTransformed must be implemented by all subclasses');
  }
}
