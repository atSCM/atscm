'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _xmlJs = require('xml-js');

var _Transformer = require('./Transformer');

var _SplittingTransformer = require('./SplittingTransformer');

var _SplittingTransformer2 = _interopRequireDefault(_SplittingTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

    function build(object, buildOptions) {
      if (!object.declaration) {
        Object.assign(object, {
          declaration: {
            attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'no' }
          }
        });
      }

      return (0, _xmlJs.js2xml)(object, Object.assign(buildOptions, {
        attributeValueFn(val) {
          return val.replace(/&(?!amp;)/g, '&amp;').replace(/</g, '&lt;');
        }
      }));
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {function(object: Object): string}
     */
    this._fromDBBuilder = object => build(object, { compact: false, spaces: 2 });

    // eslint-disable-next-line jsdoc/require-param
    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {function(object: Object): string}
     */
    this._fromFilesystemBuilder = object => {
      const xml = build(object, { compact: false, spaces: 1 });
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
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    try {
      callback(null, (0, _xmlJs.xml2js)(file.contents, { compact: false }));
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Builds an XML string from an object.
   * @param {Object} object The object to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(object, callback) {
    try {
      callback(null, this.builder(object));
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Tells if the given parsed XML node is an element (not a text / cdata node).
   * @param {Object} node The parsed node.
   * @return {boolean} `true` if the node has type 'element'.
   */
  isElement({ type }) {
    return type === 'element';
  }

  /** Tells if the given parsed XML node is an elment and has the given tag name.
   * @param {Object} node The parsed node.
   * @param {string} tagName The tag name to check for.
   * @return {boolean} `true` if the node is an element with the given tag name.
   */
  isElementWithName({ type, name }, tagName) {
    return this.isElement({ type }) && name === tagName;
  }

  /**
   * Returns a node's child elements with the given tag name.
   * @param {Object} node The node to check in.
   * @param {string} tagName The tag name to search for.
   * @return {Object[]} The matching child elements.
   */
  findChildren(node, tagName) {
    if (!node || !node.elements) {
      return [];
    }

    return node.elements.filter(child => this.isElementWithName(child, tagName));
  }

  /**
   * Returns a node's first child element with the given tag name, or `null`.
   * @param {Object} node The node to check in.
   * @param {string} tagName The tag name to search for.
   * @return {Object?} The matching child elements.
   */
  findChild(node, tagName) {
    if (!node || !node.elements) {
      return null;
    }

    for (let i = 0; i < node.elements.length; i++) {
      if (this.isElementWithName(node.elements[i], tagName)) {
        return node.elements[i];
      }
    }

    return null;
  }

  /**
   * Returns and removes a node's child elements with the given tag name.
   * @param {Object} node The node to check in.
   * @param {string} tagName The tag name to search for.
   * @return {Object[]} The matching child elements.
   */
  removeChildren(node, tagName) {
    if (!node || !node.elements) {
      return [];
    }

    const removed = [];

    // eslint-disable-next-line no-param-reassign
    node.elements = node.elements.filter(child => {
      if (this.isElementWithName(child, tagName)) {
        removed.push(child);
        return false;
      }
      return true;
    });

    return removed;
  }

  /**
   * Returns and removes a node's first child element with the given tag name, if no match is found
   * `null` is returned.
   * @param {Object} node The node to check in.
   * @param {string} tagName The tag name to search for.
   * @return {Object?} The matching child elements.
   */
  removeChild(node, tagName) {
    if (!node || !node.elements) {
      return null;
    }

    for (let i = 0; i < node.elements.length; i++) {
      if (this.isElementWithName(node.elements[i], tagName)) {
        return node.elements.splice(i, 1)[0];
      }
    }

    return null;
  }

  /**
   * Returns a parsed node's text content. Works for 'text' and 'cdata' nodes.
   * @param {Object} node The parsedNode.
   * @return {string?} The nodes text content.
   */
  textContent(node) {
    if (!node || !node.elements) {
      return null;
    }

    const contentNode = node.elements[0];

    // FIXME: Only works for { type: 'text', text: 'value' } and { type: 'cdata', cdata: 'data' }
    return contentNode[contentNode.type];
  }

}
exports.default = XMLTransformer;
//# sourceMappingURL=XMLTransformer.js.map