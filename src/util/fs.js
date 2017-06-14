import { resolve as resolvePath } from 'path';
import { stat } from 'fs';

/**
 * Returns the {@link fs~Stats} for a path.
 * @param {string} path The path to look at.
 * @return {Promise<fs~Stats, Error>} Fulfilled with the requested stats or rejected with the error
 * that occurred.
 */
export function getStat(path) {
  return new Promise((resolve, reject) => {
    stat(resolvePath(path), (err, stats) => {
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
export function validateDirectoryExists(directoryPath) {
  return getStat(directoryPath)
    .then(stats => {
      if (!(stats.isDirectory())) {
        throw new Error(`${resolvePath(directoryPath)} is not a directory`);
      }

      return stat;
    });
}
