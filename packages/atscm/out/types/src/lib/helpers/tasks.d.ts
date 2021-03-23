/**
 * Adds additional infomation to the error's message and rethows it.
 * @param {Error} error The error that occured.
 * @throws {Error} The extended error.
 */
export function handleTaskError(error: Error): void;
/**
 * Closes open sessions once a task is complete.
 * @return {Promise<void>} Resolved once cleanup is complete.
 */
export function finishTask(): Promise<void>;
