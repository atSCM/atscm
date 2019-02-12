import Logger from 'gulplog';

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

export default class Transformer {

  static combinedTransformer(transformers, direction) {
    const directed = transformers.map(t => t.withDirection(direction));

    if (direction === TransformDirection.FromFilesystem) { directed.reverse(); }

    return async (node, context) => {
      for (const transformer of directed) {
        if (await transformer.compatTransform(direction, node, context) !== undefined) {
          // break;
        }
      }
    };
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

  /**
   * Determines if a node's value node should be read, e.G. The *Variable.Bool* file for a node
   * defined in *.Variable.Bool.Json*.
   * @param {FileNode} node The node to read or not.
   * @return {boolean?} *true* if the node's value file should be read, undefined to let other
   * transformers decide.
   */
  readNodeFile(node) { // eslint-disable-line no-unused-vars
    return undefined;
  }

  compatTransform(direction, node, context) {
    const transform = (direction === TransformDirection.FromDB ?
      this.transformFromDB :
      this.transformFromFilesystem).bind(this);

    const fnName = `${this.constructor.name}#transform${
      direction === TransformDirection.FromDB ? 'FromDB' : 'FromFilesystem'
    }`;

    return new Promise((resolve, reject) => {
      const promise = transform(node, context, (err, result) => {
        if (!this.constructor._warnedStreamAPI) {
          this.constructor._warnedStreamAPI = true;
          Logger.debug(`Deprecated: ${fnName} uses the Stream API instead of async/await.`);
        }
        if (err) { return reject(err); }

        // Handle "repush"
        if (result === node) { return resolve(); }

        return resolve(result);
      });

      if (promise instanceof Promise) {
        promise.then(resolve, reject);
      } else if (this.transformFromDB.length < 3) {
        reject(new Error(`${fnName} did not return a Promise.
  - Did you forget \`async\`?`));
      }
    });
  }

}
