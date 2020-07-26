/**
 * Prints the progress of a task.
 * @param {Promise<any>} task The task to print the progress for.
 * @param {Object} options The options used.
 * @param {function(): number} options.getter A function returning the current progress.
 * @param {function(value: number): string} options.formatter A function returning a log message for
 * the progress passed.
 * @param {string} [options.level='info'] The log level to use.
 * @param {boolean} [options.logResult=true] If the final progress should be printed.
 * @example <caption>A basic implementation</caption>
 * const task = doSomething(); // Returns a Promise
 *
 * reportProgress(task, {
 *   getter: () => getTaskProgress(), // returns a number, e.g. 13 if 13 files have been written
 *   formatter: value => `${value} files written`,
 * })
 *  .then(result => { // Results get passed directly from `task`
 *    console.log(`The result is: ${result}`);
 *  })
 *  .catch(console.error) // which means you need error handling as well!
 */
export function reportProgress(task: Promise<any>, { getter, formatter, level, logResult }?: {
    getter: () => number;
    formatter: (arg0: any, arg1: number) => string;
    level: string;
    logResult: boolean;
}): Promise<void>;
