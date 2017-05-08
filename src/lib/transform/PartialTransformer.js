import filter from 'gulp-filter';
import Transformer from './Transformer';

/**
 * A transformer that transforms only some of the files read.
 * @abstract
 */
export default class PartialTransformer extends Transformer {

  constructor(options) {
    super(options);

    this.filter = filter(file => this.shouldBeTransformed(file), { restore: true });
  }

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

  applyToStream(stream, direction) {
    const filteredStream = stream.pipe(this.filter);

    return (this.applyToFilteredStream(filteredStream, direction) ||
      filteredStream.pipe(this.withDirection(direction)))
      .pipe(this.filter.restore);
  }

  applyToFilteredStream(stream, direction) { // eslint-disable-line no-unused-vars
    return false;
  }

}
