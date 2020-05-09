/**
 * Cleans up after the app ended with the specified code or signal.
 * @param {?number} exitCode The exit code received.
 * @param {?string} signal The signal that triggered the exit.
 * @param {function()} uninstall The uninstall script to run.
 * @return {boolean} `true` if the process should continue exiting.
 */
export default function cleanup(exitCode: number, signal: string, uninstall: () => any): boolean;
