"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _Transformer = _interopRequireDefault(require("./Transformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
class ModernPartialTransformer extends _Transformer.default {
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

exports.default = ModernPartialTransformer;
//# sourceMappingURL=PartialTransformer.js.map