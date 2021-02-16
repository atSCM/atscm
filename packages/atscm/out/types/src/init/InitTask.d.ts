/**
 * The action run when running "atscm init".
 */
export default class InitTask {
    /**
     * Returns the globs of the processed files for the given config lanugage.
     * @param {string} langId The configuration language used.
     * @return {string[]} Globs of the files to handle.
     */
    static filesToHandle(langId: string): string[];
    /**
     * Runs the task with the given options.
     * @param {Object} options The options to use.
     * @return {Promise<{ install: string[] }, Error>} Resolved with information on further actions
     * to run or rejected if the task failed.
     */
    static run(options: any): Promise<{
        install: string[];
    }>;
}
