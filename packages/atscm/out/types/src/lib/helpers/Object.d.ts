/**
 * Switches keys and values in an object. E.G.: { "a": 1 } becomes { 1: "a" }.
 * @param {Object} obj The object to reverse.
 * @return {Object} The reversed object.
 */
export function reverse(obj: any): any;
/**
 * Picks some properties from an object and returns a new object containing these.
 * @param {Object} obj The object to pick from.
 * @param {Array<string>} properties Names of the properties to pick.
 * @return {Object} The resulting object.
 */
export function pick(obj: any, properties: Array<string>): any;
