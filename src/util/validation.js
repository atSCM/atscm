/**
 * Checks if the given item is not defined or has an incorrect base type
 * @param {*} item The item to check
 * @param {*} type The base type of the given parameter
 * @return {Boolean} parameter is valid(=true) or not(=false)
 * to ignore.
 */
function isUndefinedOrHasWrongType(item, type) {
  return item === undefined || item === null || item.constructor !== type;
}

/**
 * Checks if the given var or object is defined and has the correct base type
 * Works for Arrays and Scalar types
 * @param {*} param The parameter to check
 * @param {*} type The base type of the given parameter
 * @return {Boolean} parameter is valid(=true) or not(=false)
 * to ignore.
 */
export default function checkType(param, type) {
  let isValid = true;

  if (param instanceof Array) {
    param.forEach(item => {
      if (isUndefinedOrHasWrongType(item, type)) isValid = false;
    });
  } else {
    isValid = !isUndefinedOrHasWrongType(param, type);
  }

  return isValid;
}
