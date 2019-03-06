/* eslint-disable import/prefer-default-export */

/**
 * Adds additional infomation to the error's message and rethows it.
 * @param {Error} error The error that occured.
 * @throws {Error} The extended error.
 */
export function handleTaskError(error) {
  if (error.node) {
    Object.assign(error, {
      message: `${error.message}
 - Node: ${error.node.nodeId}`,
    });
  }

  throw error;
}
