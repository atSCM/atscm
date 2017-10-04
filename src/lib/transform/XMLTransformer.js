import { EOL } from 'os';
import { TransformDirection } from './Transformer';
import SplittingTransformer from './SplittingTransformer';
import {parse as xmlStringToObj, serialize as objToXmlString} from 'xamel';
import * as xmlLib from 'xamel/lib/xml';

/**
 * Definition for default xml header
 * @type {String}
 */
const XmlHeader = `<?xml version='1.0' encoding='UTF-8' standalone='no'?>\n`;

/**
 * List of XML Tags needed for relative node addresses
 * @type {String[]}
 */
const RelativePathElements = [
  'Elements',
  'RelativePathElement',
  'TargetName'
];

/**
 * A transformer used to transform XML documents.
 */
export default class XMLTransformer extends SplittingTransformer {

  /**
   * Creates a new XMLTransformer based on some options.
   * @param {Object} options The options to use.
   */
  constructor(options) {
    super(options);
  }

  /**
   * Creates a new {xamel~NodeSet}
   * @param {xamel~Tag[]} scriptCode The script code to store
   */
  createNodeSet(nodes) {
    return new xmlLib.NodeSet(nodes);
  }

  /**
   * Creates a new {xamel~Tag}
   * @param {String} tagName The xml tag name
   * @param {Object} attributes Object containing xml attributes
   * @param {xamel~Tag} parentTag The parent tag the created tag belongs to
   * @param {*} initialChildNode The tags child item
   */
  createTag(tagName, attributes, parentTag, initialChildNode) {
    const sortedAttr = Object.keys(attributes).sort().forEach(key => attributes[key])
    const tag = new xmlLib.Tag(tagName, attributes, parentTag);

    if (initialChildNode) {
      if (initialChildNode instanceof xmlLib.Tag) {
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
    return new xmlLib.CData(scriptCode);
  }

  /**
   * Creates a new <RelativePath> tag
   * @param {Object} config The relative path elements configuration object
   * @param {xamel~Tag} parentTag The parent tag the relative path tag belongs to
   */
  createRelPathTag(configObj, parentTag) {
    const relPathTag = this.createTag('RelativePath', {}, parentTag);

    if (configObj) {
      let currParentTag = relPathTag;

      // Build relative path element structure
      RelativePathElements.forEach(tagName => {
        let tag = this.createTag(tagName, {}, currParentTag);
        currParentTag.append(tag);
        currParentTag = tag;
      });

      // Append relative path information
      currParentTag
        .append(this.createTag('NamespaceIndex', {}, currParentTag, configObj.nameSpaceIndex))
        .append(this.createTag('Name', {}, currParentTag, configObj.nodePath));

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
    xmlStringToObj(file.contents.toString(),
     {
       cdata: true,
       strictEntities: true,
       normalize: true
     },
     callback);
  }

  /**
   * Builds an XML string from an object.
   * @param {xml2js~Builder} xmlObj The object to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(xmlObj, callback) {
    try {
      callback(null, `${XmlHeader}${objToXmlString(xmlObj, 
        {
          pretty: true,
          header: false
        })}`);
    } catch (e) {
      callback(e);
    }
  }
}
