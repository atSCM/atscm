"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = require("os");

var _modifyXml = require("modify-xml");

var _Transformer = require("./Transformer");

var _SplittingTransformer = _interopRequireDefault(require("./SplittingTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer used to transform XML documents.
 */
class XMLTransformer extends _SplittingTransformer.default {
  /**
   * Creates a new XMLTransformer based on some options.
   * @param {Object} options The options to use.
   */
  constructor(options) {
    super(options);

    function build(object, buildOptions) {
      const root = object.childNodes.find(n => (0, _modifyXml.isElement)(n));

      if (root) {
        (0, _modifyXml.moveToTop)(root, 'metadata');
        (0, _modifyXml.moveToTop)(root, 'defs');
        (0, _modifyXml.moveToTop)(root, 'title');
      }

      return (0, _modifyXml.render)(object, {
        indent: ' '.repeat(buildOptions.spaces)
      });
    } // eslint-disable-next-line jsdoc/require-param

    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {function(object: Object): string}
     */


    this._fromDBBuilder = object => {
      const xml = build(object, {
        compact: false,
        spaces: 2
      });
      return xml.replace(/\r?\n/g, _os.EOL);
    }; // eslint-disable-next-line jsdoc/require-param

    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {function(object: Object): string}
     */


    this._fromFilesystemBuilder = object => {
      const xml = build(object, {
        compact: false,
        spaces: 1
      });
      return xml.replace(/\r?\n/g, '\n');
    };
  }
  /**
   * Returns the XML builder to use based on the current {@link Transformer#direction}.
   * @type {function(object: Object): string}
   */


  get builder() {
    return this.direction === _Transformer.TransformDirection.FromDB ? this._fromDBBuilder : this._fromFilesystemBuilder;
  }
  /**
   * Parses XML in a node's contents.
   * @param {Node} node The node to process.
   */


  decodeContents(node) {
    const rawLines = this.direction === _Transformer.TransformDirection.FromDB ? node.value.value.toString() : node.stringValue;

    try {
      return (0, _modifyXml.parse)(rawLines);
    } catch (error) {
      if (error.line) {
        Object.assign(error, {
          rawLines,
          location: {
            start: {
              line: error.line + 1,
              column: error.column + 1
            }
          }
        });
      }

      throw error;
    }
  }
  /**
   * Builds an XML string from an object.
   * @param {Object} object The object to encode.
   */


  encodeContents(object) {
    return this.builder(object);
  }

}

exports.default = XMLTransformer;
//# sourceMappingURL=XMLTransformer.js.map