"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _os = require("os");

var _xmlJs = require("xml-js");

var _xml = require("../helpers/xml");

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
      if (!object.declaration) {
        Object.assign(object, {
          declaration: {
            attributes: {
              version: '1.0',
              encoding: 'UTF-8',
              standalone: 'no'
            }
          }
        });
      }

      const root = object.elements.find(_xml.isElement);

      function addOnTop(parent, name) {
        const node = (0, _xml.removeChild)(parent, name);

        if (node) {
          parent.elements.unshift(node);
        }
      }

      if (root.elements) {
        addOnTop(root, 'metadata');
        addOnTop(root, 'defs');
        addOnTop(root, 'title');
      }

      return (0, _xmlJs.js2xml)(object, Object.assign(buildOptions, {
        attributeValueFn(val) {
          return val.replace(/&(?!(amp|quot);)/g, '&amp;').replace(/</g, '&lt;');
        }

      }));
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
      return xml.replace(/\r?\n/g, '\r\n');
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
    return (0, _xmlJs.xml2js)(this.direction === _Transformer.TransformDirection.FromDB ? node.value.value : node.stringValue, {
      compact: false
    });
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