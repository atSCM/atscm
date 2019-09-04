import Session from '../server/Session';

/**
 * Adds additional infomation to the error's message and rethows it.
 * @param {Error} error The error that occured.
 * @throws {Error} The extended error.
 */
export function handleTaskError(error) {
  const additionalMessage = error.node ? `
 - Node: ${error.node.nodeId}` : '';

  Object.assign(error, {
    message: `${error.message}${additionalMessage}`,
    stack: `${error.stack}${additionalMessage}`,
  });

  throw error;
}

/**
 * Closes open sessions once a task is complete.
 * @return {Promise<void>} Resolved once cleanup is complete.
 */
export function finishTask() {
  return Session.closeOpen();
}
