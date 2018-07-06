import { EOL } from 'os';
import { xml2js, js2xml } from 'xml-js';
import { isElement, removeChild } from '../helpers/xml';
import { TransformDirection } from './Transformer';
import SplittingTransformer from './SplittingTransformer';

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

    function build(object, buildOptions) {
      if (!object.declaration) {
        Object.assign(object, {
          declaration: {
            attributes: { version: '1.0', encoding: 'UTF-8', standalone: 'no' },
          },
        });
      }

      const root = object.elements.find(isElement);

      function addOnTop(parent, name) {
        const node = removeChild(parent, name);

        if (node) {
          parent.elements.unshift(node);
        }
      }

      if (root.elements) {
        addOnTop(root, 'metadata');
        addOnTop(root, 'defs');
        addOnTop(root, 'title');
      }

      return js2xml(object, Object.assign(buildOptions, {
        attributeValueFn(val) {
          return val
            .replace(/&(?!(amp|quot);)/g, '&amp;')
            .replace(/</g, '&lt;');
        },
      }));
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {function(object: Object): string}
     */
    this._fromDBBuilder = object => {
      const xml = build(object, { compact: false, spaces: 2 });
      return xml.replace(/\r?\n/g, EOL);
    };

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
    return this.direction === TransformDirection.FromDB ?
      this._fromDBBuilder :
      this._fromFilesystemBuilder;
  }

  /**
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    try {
      callback(null, xml2js(file.contents, { compact: false }));
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

}
