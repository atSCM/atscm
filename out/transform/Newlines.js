'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _os = require('os');

var _nodeOpcua = require('node-opcua');

var _PartialTransformer = require('../lib/transform/PartialTransformer');

var _PartialTransformer2 = _interopRequireDefault(_PartialTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A regular expression matching trailing newlines.
 */
const trailingNewlineRegExp = /\r\n+$/;

/**
 * A transformer that handles newline characters in files. During a pull, all breaks are converted
 * the OS-native EOL character and a trailing newline is added (for better git diffs). On push, CRLF
 * characters are used and those trailing newlines are removed again.
 */
class NewlinesTransformer extends _PartialTransformer2.default {

  /**
   * Returns `true` for all files except binary ones.
   * @param {AtviseFile} file The file being transformed.
   */
  shouldBeTransformed(file) {
    return file.stem[0] === '.' || file.dataType !== _nodeOpcua.DataType.ByteString;
  }

  /**
   * Adds converts line breaks to the current OS's native EOL characters and adds trailing newlines.
   * @param {AtviseFile} file The file being transformed.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the corrected file.
   */
  transformFromDB(file, enc, callback) {
    let str = file.contents.toString().replace(/\r?\n/g, _os.EOL);

    if (!str.match(trailingNewlineRegExp)) {
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
    const str = file.contents.toString().replace(/\r?\n/g, '\r\n').replace(trailingNewlineRegExp, '');

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