'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer that transforms only some of the files read.
 * @abstract
 */
class PartialTransformer extends _Transformer2.default {

  /**
   * `true` if `file` should be transformed.
   * @param {AtviseFile} file The file to transform or not.
   * @abstract
   */
  shouldBeTransformed(file) {
    // eslint-disable-line no-unused-vars
    throw new Error('PartialTransformer#shouldBeTransformed must be implemented by all subclasses');
  }

  /**
   * Transforms a file if {@link PartialTransformer#shouldBeTransformed} returns `true`.
   * @param {AtviseFile} file The file to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occured
   * while transforming or (optionally) the transformed file.
   */
  _transform(file, enc, callback) {
    if (this.shouldBeTransformed(file)) {
      super._transform(file, enc, callback);
    } else {
      callback(null, file);
    }
  }

}
exports.default = PartialTransformer;