"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.promisified = exports.delay = void 0;

/**
 * Returns a promise that resolves after the given duration.
 * @param ms Milliseconds to delay.
 * @return A promise resolved after the specified delay.
 */
const delay = ms => new Promise(resolve => setTimeout(() => resolve(), ms));

exports.delay = delay;

/**
 * Wraps a function with an async callback in a promise.
 * @param fn The function to promisify.
 */
const promisified = fn => new Promise((resolve, reject) => {
  fn((err, data) => err ? reject(err) : resolve(data));
});

exports.promisified = promisified;
//# sourceMappingURL=async.js.map