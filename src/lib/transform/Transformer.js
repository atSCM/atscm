import { ctor as throughStreamClass, obj as createStream } from 'through2';

/**
 * The directions a transformer can be run in.
 * @type {{FromDB: String, FromFilesystem: String}}
 */
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

  /**
   * Creates a stream with all transformers passed, with the given direction. Transformers are
   * reversed if using {@link TransformDirection.FromFilesystem}.
   * @param {Transformer[]} transformers The transformers to apply.
   * @param {TransformDirection} direction The direction to use.
   * @return {Transformer} The last transformer passed, piped to the previous.
   */
  static applyTransformers(transformers, direction) {
    if (!isValidDirection(direction)) {
      throw new Error('Direction is invalid');
    }

    if (transformers.length === 0) {
      return createStream();
    }

    return (direction === TransformDirection.FromDB ? transformers : transformers.reverse())
      .reduce((prev, curr) => {
        const directed = curr.withDirection(direction);

        if (prev) {
          return prev.pipe(directed);
        }

        return directed;
      }, false);
  }

  /**
   * Splits a {@link vinyl~File}: The resulting is a clone of the input file, with a different path.
   * @param {vinyl~File} file The file to split.
   * @param {?String} newExtension The extension the resulting file gets.
   * @return {vinyl~File} The resulting file.
   * @example
   * // Assuming that `original` is a File with the path "path/to/file.type.xml":
   * const result = Transformer.splitFile(original, '.another');
   * // `result` is a new File, with the contents of `original` and the path
   * // "path/to/file.type/file.another"
   */
  static splitFile(file, newExtension) {
    const newFile = file.clone();

    newFile.basename = `${newFile.stem}/${newFile.stem}`;
    newFile.extname = newExtension;

    return newFile;
  }

  /**
   * Combines split files to a single one.
   * @param {vinyl~File[]} files The files to combine.
   * @param {String} newExtension The extension the resulting file gets.
   * @return {vinyl~File} The resulting file.
   */
  static combineFiles(files, newExtension) {
    const newFile = files[0].clone();

    newFile.path = `${newFile.dirname}${newExtension}`;

    return newFile;
  }

}
