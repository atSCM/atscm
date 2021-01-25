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
        trailingNewlines: boolean;
    });
    /**
     * If newlines should be added to pulled files.
     * @type {boolean}
     */
    _addTrailingNewlines: boolean;
    /**
     * `true` because we want to transform all files.
     * @type {boolean}
     */
    get transformsReferenceConfigFiles(): boolean;
}
import PartialTransformer from "../lib/transform/PartialTransformer";
