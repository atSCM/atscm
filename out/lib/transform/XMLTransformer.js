'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xml2js = require('xml2js');

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer used to transform XML documents.
 */
class XMLTransformer extends _Transformer2.default {

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
    this._fromDBBuilder = new _xml2js.Builder({ cdata: false });

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
      cdata: false
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
      callback(null, this.builder.buildObject(object));
    } catch (e) {
      callback(e);
    }
  }

}
exports.default = XMLTransformer;