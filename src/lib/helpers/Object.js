/* eslint-disable import/prefer-default-export */

/**
 * Switches keys and values in an object. E.G.: { "a": 1 } becomes { 1: "a" }.
 * @param {Object} obj The object to reverse.
 * @return {Object} The reversed object.
 */
export function reverse(obj) {
  return Object.keys(obj)
    .reduce((result, key) => Object.assign(result, {
      [obj[key]]: key,
    }), {});
}
