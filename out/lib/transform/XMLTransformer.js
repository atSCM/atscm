'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _SplittingTransformer = require('./SplittingTransformer');

var _SplittingTransformer2 = _interopRequireDefault(_SplittingTransformer);

var _xamel = require('../xml/xamel');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Definition for default xml header
 * @type {String}
 */
const XmlHeader = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';

/**
 * List of XML Tags needed for relative node addresses
 * @type {String[]}
 */
const RelativePathElements = ['Elements', 'RelativePathElement', 'TargetName'];

/**
 * A transformer used to transform XML documents.
 */
class XMLTransformer extends _SplittingTransformer2.default {
  /**
   * Creates a new {xamel~NodeSet}
   * @param {xamel~Tag[]} nodes The nodes to store in the created NodeSet
   */
  createNodeSet(nodes) {
    return new _xamel.xml.NodeSet(nodes);
  }

  /**
   * Creates a new {xamel~Tag}
   * @param {String} tagName The xml tag name
   * @param {Object} attributes Object containing xml attributes
   * @param {xamel~Tag} parentTag The parent tag the created tag belongs to
   * @param {*} initialChildNode The tags child item
   */
  createTag(tagName, attributes, parentTag, initialChildNode) {
    const tag = new _xamel.xml.Tag(tagName, attributes, parentTag);

    if (initialChildNode) {
      if (initialChildNode instanceof _xamel.xml.Tag) {
        // eslint-disable-next-line no-param-reassign
        initialChildNode.parent = tag;
      }
      tag.append(initialChildNode);
    }

    return tag;
  }

  /**
   * Creates a new {xamel~CData}
   * @param {String} scriptCode The script code to store
   */
  createCData(scriptCode) {
    return new _xamel.xml.CData(scriptCode);
  }

  /**
   * Creates a new <RelativePath> tag
   * @param {Object} configObj The relative path elements configuration object
   * @param {xamel~Tag} parentTag The parent tag the relative path tag belongs to
   */
  createRelPathTag(configObj, parentTag) {
    const relPathTag = this.createTag('RelativePath', {}, parentTag);

    if (configObj) {
      let currParentTag = relPathTag;

      // Build relative path element structure
      RelativePathElements.forEach(tagName => {
        const tag = this.createTag(tagName, {}, currParentTag);
        currParentTag.append(tag);
        currParentTag = tag;
      });

      // Append relative path information
      currParentTag.append(this.createTag('NamespaceIndex', {}, currParentTag, configObj.nameSpaceIndex)).append(this.createTag('Name', {}, currParentTag, configObj.nodePath));
    } else {
      relPathTag.append(this.createTag('Elements', {}, relPathTag));
    }

    return relPathTag;
  }

  /**
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    (0, _xamel.parse)(file.contents.toString(), {
      cdata: true,
      strictEntities: true,
      normalize: true
    }, callback);
  }

  /**
   * Builds an XML string from an object.
   * @param {xml2js~Builder} xmlObj The object to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(xmlObj, callback) {
    try {
      callback(null, `${XmlHeader}${(0, _xamel.serialize)(xmlObj, {
        pretty: true,
        header: false
      })}`);
    } catch (e) {
      callback(e);
    }
  }
}
exports.default = XMLTransformer;
//# sourceMappingURL=XMLTransformer.js.map