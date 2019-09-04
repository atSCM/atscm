"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = void 0;

/* eslint-disable import/prefer-default-export */

/**
 * Returns a promise that resolves after the given duration.
 * @param {number} ms Milliseconds to delay.
 * @return {Promise<void>} A promise resolved after the specified delay.
 */
const delay = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

exports.delay = delay;
//# sourceMappingURL=async.js.map