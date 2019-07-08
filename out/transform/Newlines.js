"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = require("os");

var _variant = require("node-opcua/lib/datamodel/variant");

var _PartialTransformer = _interopRequireDefault(require("../lib/transform/PartialTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A regular expression matching trailing newlines.
 */
const trailingNewlineRegExp = /\r?\n$/;
/**
 * A transformer that handles newline characters in files. During a pull, all breaks are converted
 * the OS-native EOL character and (optionally) a trailing newline is added (for better git diffs).
 * On push, CRLF characters are used and those trailing newlines are removed again.
 */

class NewlinesTransformer extends _PartialTransformer.default {
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
    return file.stem[0] === '.' || file.dataType !== _variant.DataType.ByteString;
  }
  /**
   * Adds converts line breaks to the current OS's native EOL characters and adds trailing newlines.
   * @param {AtviseFile} file The file being transformed.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the corrected file.
   */


  transformFromDB(file, enc, callback) {
    let str = file.contents.toString().replace(/\r?\n/g, _os.EOL);

    if (this._addTrailingNewlines && !str.match(trailingNewlineRegExp)) {
      str += _os.EOL;
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
    let str = file.contents.toString().replace(/\r?\n/g, '\r\n');

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

exports.default = NewlinesTransformer;
//# sourceMappingURL=Newlines.js.map