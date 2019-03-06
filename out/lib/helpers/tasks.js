"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleTaskError = handleTaskError;

/* eslint-disable import/prefer-default-export */

/**
 * Adds additional infomation to the error's message and rethows it.
 * @param {Error} error The error that occured.
 * @throws {Error} The extended error.
 */
function handleTaskError(error) {
  const additionalMessage = error.node ? `
 - Node: ${error.node.nodeId}` : '';
  Object.assign(error, {
    message: `${error.message}${additionalMessage}`,
    stack: `${error.stack}${additionalMessage}`
  });
  throw error;
}
//# sourceMappingURL=tasks.js.map