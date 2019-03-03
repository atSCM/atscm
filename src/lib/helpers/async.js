/* eslint-disable import/prefer-default-export */

/**
 * Returns a promise that resolves after the given duration.
 * @param {number} ms Milliseconds to delay.
 * @return {Promise<void>} A promise resolved after the specified delay.
 */
export const delay = ms => new Promise((resolve) => setTimeout(() => resolve(), ms));
