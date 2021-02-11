"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStat = getStat;
exports.validateDirectoryExists = validateDirectoryExists;

var _path = require("path");

var _fs = require("fs");

/**
 * Returns the {@link fs~Stats} for a path.
 * @param {string} path The path to look at.
 * @return {Promise<fs~Stats, Error>} Fulfilled with the requested stats or rejected with the error
 * that occurred.
 */
function getStat(path) {
  return new Promise((resolve, reject) => {
    (0, _fs.stat)((0, _path.resolve)(path), (err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    });
  });
}
/**
 * Checks it a given path holds a directory and returns it's {@link fs~Stats} if found.
 * @param {string} directoryPath The path to look at.
 * @return {Promise<fs~Stats, Error>} Fulfilled with the directory's stats or rejected with the
 * error that occurred.
 */


function validateDirectoryExists(directoryPath) {
  return getStat(directoryPath).then(stats => {
    if (!stats.isDirectory()) {
      throw new Error(`${(0, _path.resolve)(directoryPath)} is not a directory`);
    }

    return _fs.stat;
  });
}
//# sourceMappingURL=fs.js.map