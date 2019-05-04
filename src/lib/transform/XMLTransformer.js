import { EOL } from 'os';
import { parse, render, isElement, moveToTop } from 'modify-xml';
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
      const root = object.childNodes.find(n => isElement(n));

      if (root) {
        moveToTop(root, 'metadata');
        moveToTop(root, 'defs');
        moveToTop(root, 'title');
      }

      return render(object, { indent: ' '.repeat(buildOptions.spaces) });
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
      return xml.replace(/\r?\n/g, '\n');
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
   * Parses XML in a node's contents.
   * @param {Node} node The node to process.
   */
  decodeContents(node) {
    return parse(this.direction === TransformDirection.FromDB ?
      node.value.value :
      node.stringValue);
  }

  /**
   * Builds an XML string from an object.
   * @param {Object} object The object to encode.
   */
  encodeContents(object) {
    return this.builder(object);
  }

}
