import { ctor as throughStreamClass } from 'through2';

export const TransformDirection = {
  FromDB: 'FromDB',
  FromFilesystem: 'FromFilesystem',
};

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
  constructor(options) {
    super();

    if (options) {
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
  }

  /**
   * Returns the Transformer with the given direction
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

  /**
   * Calls {@link Transformer#transformFromDB} or {@link Transformer#transformFromFilesystem}
   * based on the transformer's direction.
   * @param {Object} chunk The chunk to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, obj: ?Object)} callback Called with the error that occured while
   * transforming or (optionally) the transformed object.
   * @throws {Error} Throws an error if the transformer has no valid direction.
   */
  _transform(chunk, enc, callback) {
    if (!this.direction) {
      callback(new Error('Transformer has no direction'));
    } else if (this.direction === TransformDirection.FromDB) {
      this.transformFromDB(chunk, enc, callback);
    } else {
      this.transformFromFilesystem(chunk, enc, callback);
    }
  }

  /**
   * **Must be overridden by all subclasses:** Transforms the given chunk when using
   * {@link TransformDirection.FromDB}.
   * @param {Object} chunk The chunk to transform.
   * @param {String} enc The encoding used.
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
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, obj: ?Object)} callback Called with the error that occured while
   * transforming or (optionally) the transformed object.
   */
  transformFromFilesystem(chunk, enc, callback) {
    callback(new Error('Transformer#transformFromFilesystem must be overridden by all subclasses'));
  }

}
