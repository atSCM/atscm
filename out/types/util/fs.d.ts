/**
 * Returns the {@link fs~Stats} for a path.
 * @param {string} path The path to look at.
 * @return {Promise<fs~Stats, Error>} Fulfilled with the requested stats or rejected with the error
 * that occurred.
 */
export function getStat(path: string): Promise<any>;
/**
 * Checks it a given path holds a directory and returns it's {@link fs~Stats} if found.
 * @param {string} directoryPath The path to look at.
 * @return {Promise<fs~Stats, Error>} Fulfilled with the directory's stats or rejected with the
 * error that occurred.
 */
export function validateDirectoryExists(directoryPath: string): Promise<any>;
