import filter from 'gulp-filter';
import Transformer from './Transformer';

/**
 * A transformer that transforms only some of the files read.
 * @abstract
 */
export default class PartialTransformer extends Transformer {

  /**
   * Creates a new partial transformer with the specified options.
   * @param {Object} options The options to use. See {@link Transformer#constructor} for available
   * options.
   */
  constructor(options = {}) {
    super(options);

    /**
     * The filter stream used.
     * @type {Stream}
     */
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
   * @param {string} enc The encoding used.
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

  /**
   * Applies the transformer to the given stream. It does so by running the following steps:
   *  - Pipe the {@link PartialTransformer#filter} stream
   *  - If PartialTransformer#applyToFilteredStream is overrridden, apply it.
   *  - Otherwise pipe {@link Transformer#withDirection}.
   *  - Restore the filter stream.
   * @param {Stream} stream The stream to apply the transformer to.
   * @param {TransformDirection} direction The direction to use.
   * @return {Stream} The resulting stream.
   */
  applyToStream(stream, direction) {
    const filteredStream = stream.pipe(this.filter);

    return (this.applyToFilteredStream(filteredStream, direction) ||
      filteredStream.pipe(this.withDirection(direction)))
      .pipe(this.filter.restore);
  }

  /**
   * Applies a stream transformer to the given, already filtered stream. Override this method if you
   * want to pipe streams directly. Returning a falsy value (false, null, undefined, ...) invokes
   * {@link Transformer#transformFromDB} or {@link Transformer#transformFromFilesystem} instead.
   * @param {Stream} stream The stream to apply the transformer to.
   * @param {TransformDirection} direction The direction to use.
   * @return {?Stream} The resulting stream.
   */
  applyToFilteredStream(stream, direction) { // eslint-disable-line no-unused-vars
    return false;
  }

}
