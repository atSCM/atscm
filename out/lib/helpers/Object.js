"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reverse = reverse;
exports.pick = pick;

/**
 * Switches keys and values in an object. E.G.: { "a": 1 } becomes { 1: "a" }.
 * @param {Object} obj The object to reverse.
 * @return {Object} The reversed object.
 */
function reverse(obj) {
  return Object.keys(obj).reduce((result, key) => Object.assign(result, {
    [obj[key]]: key
  }), {});
}
/**
 * Picks some properties from an object and returns a new object containing these.
 * @param {Object} obj The object to pick from.
 * @param {Array<string>} properties Names of the properties to pick.
 * @return {Object} The resulting object.
 */


function pick(obj, properties) {
  return properties.reduce((props, key) => Object.assign(props, {
    [key]: obj[key]
  }), {});
}
//# sourceMappingURL=Object.js.map