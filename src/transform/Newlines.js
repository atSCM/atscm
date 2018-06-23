import { EOL } from 'os';
import { DataType } from 'node-opcua';
import PartialTransformer from '../lib/transform/PartialTransformer';

/**
 * A regular expression matching trailing newlines.
 */
const trailingNewlineRegExp = /\r?\n$/;

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
  constructor(options = {}) {
    super(options);

    /**
     * If newlines should be added to pulled files.
     * @type {boolean}
     */
    this._addTrailingNewlines = options.trailingNewlines || false;
  }

  /**
   * Returns `true` for all files except binary ones.
   * @param {AtviseFile} file The file being transformed.
   * @return {boolean} Always `true`.
   */
  shouldBeTransformed(file) {
    return file.stem[0] === '.' || file.dataType !== DataType.ByteString;
  }

  /**
   * Adds converts line breaks to the current OS's native EOL characters and adds trailing newlines.
   * @param {AtviseFile} file The file being transformed.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the corrected file.
   */
  transformFromDB(file, enc, callback) {
    let str = file.contents.toString().replace(/\r?\n/g, EOL);

    if (this._addTrailingNewlines && !str.match(trailingNewlineRegExp)) {
      str += EOL;
    }

    file.contents = Buffer.from(str); // eslint-disable-line no-param-reassign

    callback(null, file);
  }

  /**
   * Removes trailing newlines and converts all breaks to CRLF.
   * @param {AtviseFile} file The file being transformed.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with resulting file.
   */
  transformFromFilesystem(file, enc, callback) {
    let str = file.contents.toString()
      .replace(/\r?\n/g, '\r\n');

    if (this._addTrailingNewlines) {
      str = str.replace(trailingNewlineRegExp, '');
    }

    file.contents = Buffer.from(str); // eslint-disable-line no-param-reassign

    callback(null, file);
  }

  /**
   * `true` because we want to transform all files.
   * @type {boolean}
   */
  get transformsReferenceConfigFiles() {
    return true;
  }

}
