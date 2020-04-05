/**
 * A transformer that handles newline characters in files. During a pull, all breaks are converted
 * the OS-native EOL character and (optionally) a trailing newline is added (for better git diffs).
 * On push, CRLF characters are used and those trailing newlines are removed again.
 */
export default class NewlinesTransformer extends PartialTransformer {
    /**
     * Creates a new newline transformer.
     * @param {Object} [options={}] The options to use.
     * @param {boolean} [options.trailingNewlines] If trailing newlines should be added. Pass *true*
     * for better git diffs.
     */
    constructor(options?: {
        trailingNewlines?: boolean;
    });
    /**
     * If newlines should be added to pulled files.
     * @type {boolean}
     */
    _addTrailingNewlines: boolean;
    /**
     * Returns `true` for all files except binary ones.
     * @param {AtviseFile} file The file being transformed.
     * @return {boolean} Always `true`.
     */
    shouldBeTransformed(file: any): boolean;
    /**
     * Adds converts line breaks to the current OS's native EOL characters and adds trailing newlines.
     * @param {AtviseFile} file The file being transformed.
     * @param {string} enc The encoding used.
     * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the corrected file.
     */
    transformFromDB(file: any, enc: string, callback: (arg0: any, arg1: Error, arg2: any, arg3: any) => any): void;
    /**
     * Removes trailing newlines and converts all breaks to CRLF.
     * @param {AtviseFile} file The file being transformed.
     * @param {string} enc The encoding used.
     * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with resulting file.
     */
    transformFromFilesystem(file: any, enc: string, callback: (arg0: any, arg1: Error, arg2: any, arg3: any) => any): void;
    /**
     * `true` because we want to transform all files.
     * @type {boolean}
     */
    get transformsReferenceConfigFiles(): boolean;
}
import PartialTransformer from "../lib/transform/PartialTransformer";
