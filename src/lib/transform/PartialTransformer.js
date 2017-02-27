import Transformer from './Transformer';

/**
 * A transformer that transforms only some of the files read.
 * @abstract
 */
export default class PartialTransformer extends Transformer {

  /**
   * `true` if `file` should be transformed.
   * @param {AtviseFile} file The file to transform or not.
   * @abstract
   */
  shouldBeTransformed(file) { // eslint-disable-line no-unused-vars
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
