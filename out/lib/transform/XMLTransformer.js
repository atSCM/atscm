'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _os = require('os');

var _xml2js = require('xml2js');

var _Transformer = require('./Transformer');

var _SplittingTransformer = require('./SplittingTransformer');

var _SplittingTransformer2 = _interopRequireDefault(_SplittingTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A special token used to encode CData section beginnings.
 * @type {String}
 */
const START_CDATA = 'STARTCDATA';

/**
 * A special token used to encode CData section endings.
 * @type {String}
 */
const END_CDATA = 'ENDCDATA';

/**
 * A transformer used to transform XML documents.
 */
class XMLTransformer extends _SplittingTransformer2.default {

  /**
   * Creates a new XMLTransformer based on some options.
   * @param {Object} options The options to use.
   */
  constructor(options) {
    super(options);

    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {xml2js~Builder}
     */
    this._fromDBBuilder = new _xml2js.Builder({
      cdata: false,
      newline: _os.EOL
    });

    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {xml2js~Builder}
     */
    this._fromFilesystemBuilder = new _xml2js.Builder({
      renderOpts: {
        pretty: true,
        indent: ' ',
        newline: '\r\n'
      },
      xmldec: {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: false
      },
      cdata: true
    });
  }

  /**
   * Returns the XML builder instance to use base on the current {@link Transformer#direction}.
   * @type {xml2js~Builder}
   */
  get builder() {
    return this.direction === _Transformer.TransformDirection.FromDB ? this._fromDBBuilder : this._fromFilesystemBuilder;
  }

  /**
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    (0, _xml2js.parseString)(file.contents, callback);
  }

  /**
   * Builds an XML string from an object.
   * @param {Object} object The object to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(object, callback) {
    try {
      callback(null, this.builder.buildObject(object).replace(new RegExp(`(<!\\[CDATA\\[)?${START_CDATA}`), '<![CDATA[').replace(new RegExp(`${END_CDATA}(\\]\\]>)?`), ']]>'));
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Helper function: Returns `true` if the given tag exists and is not empty.
   * @param {Object} tag A tag in a parsed xml document.
   * @return {Boolean} `true` if the given tag exists and is not empty.
   */
  tagNotEmpty(tag) {
    return Boolean(tag && tag.length > 0);
  }

  /**
   * Forces `string`, when assigned as textContent to a node, to be wrapped in a CDATA-section.
   * @param {String} string The string to force a CDATA-section for.
   * @return {String} The string to assign as textContent to a node.
   */
  static forceCData(string) {
    return `${START_CDATA}${string}${END_CDATA}`;
  }

}
exports.default = XMLTransformer;