import { inspect } from 'util';
import { ctor as throughStreamClass } from 'through2';

/**
 * The directions a transformer can be run in.
 * @type {{FromDB: string, FromFilesystem: string}}
 */
export const TransformDirection = {
  FromDB: 'FromDB',
  FromFilesystem: 'FromFilesystem',
};

/**
 * Checks if the given string is a valid {@link TransformDirection}.
 * @param {string} direction The direction string to check.
 * @return {boolean} `true` if the direction is valid.
 */
function isValidDirection(direction) {
  return [
    TransformDirection.FromDB,
    TransformDirection.FromFilesystem,
  ].includes(direction);
}

/**
 * A special kind of an object transform stream: It does apply different transformations based on
 * it's direction.
 * @abstract
 */
export default class Transformer extends throughStreamClass({ objectMode: true }) {

  /**
   * Creates a new Transformer with the specified options.
   * @param {Object} [options] The options to use.
   * @param {TransformDirection} [options.direction] The direction to use.
   * @throws {Error} Throws an error if the given direction is invalid.
   */
  constructor(options = {}) {
    super();

    /**
     * The options the transformer was created with. Used for printing description.
     * @type {Object}
     */
    this._options = options;

    if (options.direction) {
      if (isValidDirection(options.direction)) {
        /**
         * The transformer's direction
         * @type {TransformerDirection}
         */
        this.direction = options.direction;
      } else {
        throw new Error('Invalid direction');
      }
    }
  }

  /**
   * Returns the Transformer with the given direction.
   * @param {TransformDirection} direction The direction to use.
   * @return {Transformer} Itself, to be chainable.
   * @throws {Error} Throws an error if the given direction is invalid.
   */
  withDirection(direction) {
    if (!isValidDirection(direction)) {
      throw new Error('Invalid direction');
    }

    this.direction = direction;
    return this;
  }

  _processError(err, chunk, callback, ...args) {
    if (err) {
      const id = (this.direction === TransformDirection.FromDB ?
        chunk.nodeId :
        chunk.relative) || chunk.toString();

      // eslint-disable-next-line no-param-reassign
      err.message = `[${this.constructor.name}] ${err.message} (in ${id})`;

      callback(err);
    } else {
      callback(err, ...args);
    }
  }

  /**
   * Calls {@link Transformer#transformFromDB} or {@link Transformer#transformFromFilesystem}
   * based on the transformer's direction.
   * @param {Object} chunk The chunk to transform.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, obj: ?Object)} callback Called with the error that occured while
   * transforming or (optionally) the transformed object.
   * @throws {Error} Throws an error if the transformer has no valid direction.
   */
  _transform(chunk, enc, callback) {
    const processError = (err, ...args) => this._processError(err, chunk, callback, ...args);

    if (!this.direction) {
      callback(new Error('Transformer has no direction'));
    } else if (this.direction === TransformDirection.FromDB) {
      this.transformFromDB(chunk, enc, processError);
    } else {
      this.transformFromFilesystem(chunk, enc, processError);
    }
  }

  /**
   * **Must be overridden by all subclasses:** Transforms the given chunk when using
   * {@link TransformDirection.FromDB}.
   * @param {Object} chunk The chunk to transform.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, obj: ?Object)} callback Called with the error that occured while
   * transforming or (optionally) the transformed object.
   */
  transformFromDB(chunk, enc, callback) {
    callback(new Error('Transformer#transformFromDB must be overridden by all subclasses'));
  }

  /**
   * **Must be overridden by all subclasses:** Transforms the given chunk when using
   * {@link TransformDirection.FromFilesystem}.
   * @param {Object} chunk The chunk to transform.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, obj: ?Object)} callback Called with the error that occured while
   * transforming or (optionally) the transformed object.
   */
  transformFromFilesystem(chunk, enc, callback) {
    callback(new Error('Transformer#transformFromFilesystem must be overridden by all subclasses'));
  }

  /**
   * Applies the transformer to the given stream. By default this just invokes
   * {@link Transformer#transformFromDB} or {@link Transformer#transformFromFilesystem}. Override
   * this method if you want to pipe streams directly.
   * @param {Stream} stream The stream to apply the transformer to.
   * @param {TransformDirection} direction The direction to use.
   * @return {Stream} The resulting stream.
   */
  applyToStream(stream, direction) {
    return stream.pipe(this.withDirection(direction));
  }

  /**
   * Creates a stream with all transformers passed, with the given direction. Transformers are
   * reversed if using {@link TransformDirection.FromFilesystem}.
   * @param {Stream} stream The stream to apply the transformers to.
   * @param {Transformer[]} transformers The transformers to apply.
   * @param {TransformDirection} direction The direction to use.
   * @return {Transformer} The last transformer passed, piped to the previous.
   */
  static applyTransformers(stream, transformers, direction) {
    if (!isValidDirection(direction)) {
      throw new Error('Direction is invalid');
    }

    if (transformers.length === 0) {
      return stream;
    }

    return (direction === TransformDirection.FromDB ? transformers : transformers.reverse())
      .reduce((prev, curr) => curr.applyToStream(prev, direction), stream);
  }

  /**
   * Prints the transformer.
   * @param {?Number} depth The depth to inspect.
   * @param {Object} options See {@link util~inspect} for details.
   * @return {string} A string representation of the transformer.
   */
  inspect(depth, options) {
    const newOptions = options;
    newOptions.depth = options.depth === null ? null : options.depth - 1;

    if (depth < 0) {
      return options.stylize(`[${this.constructor.name}]`, 'special');
    }

    return `${options.stylize(this.constructor.name, 'special')}${inspect(this._options, newOptions)
      .replace(/^{/, '<').replace(/}$/, '>')
      .replace(/\n/, `\n${' '.repeat(this.constructor.name.length)}`)
    }`;
  }

}
