import { EOL } from 'os';
import { parse, render, isElement, moveToTop, attributeValues } from 'modify-xml';
import ProjectConfig from '../../config/ProjectConfig';
import { TransformDirection } from './Transformer';
import SplittingTransformer from './SplittingTransformer';

function walk(element, action, filter = isElement) {
  action(element);

  if (element.childNodes) {
    for (const child of element.childNodes.filter((n) => filter(n))) {
      walk(child, action);
    }
  }
}

/**
 * A transformer used to transform XML documents.
 */
export default class XMLTransformer extends SplittingTransformer {
  /**
   * Creates a new XMLTransformer based on some options.
   * @param {Object} [options] The options to use.
   */
  constructor(options = {}) {
    super(options);

    function build(object, buildOptions) {
      const root = object.childNodes.find((n) => isElement(n));

      if (root) {
        moveToTop(root, 'metadata');
        moveToTop(root, 'defs');
        moveToTop(root, 'desc');
        moveToTop(root, 'title');
      }

      if (ProjectConfig.sortXMLAttributes || ProjectConfig.removeBuilderRefs)
        walk(root, (e) => {
          /* eslint-disable no-param-reassign */
          if (ProjectConfig.removeBuilderRefs)
            e.attributes = e.attributes.filter((a) => !['atv:refpx', 'atv:refpy'].includes(a.name));

          if (ProjectConfig.sortXMLAttributes)
            e.attributes = e.attributes.sort((a, b) => (b.name > a.name ? -1 : 1));

          delete e.openTag;
          /* eslint-enable no-param-reassign */
        });

      return render(object, { indent: ' '.repeat(buildOptions.spaces) });
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     * The builder to use with direction {@link TransformDirection.FromDB}.
     * @type {function(object: Object): string}
     */
    this._fromDBBuilder = (object) => {
      const xml = build(object, { compact: false, spaces: 2 });
      return xml.replace(/\r?\n/g, EOL);
    };

    // eslint-disable-next-line jsdoc/require-param
    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {function(object: Object): string}
     */
    this._fromFilesystemBuilder = (object) => {
      const xml = build(object, { compact: false, spaces: 1 });
      return xml.replace(/\r?\n/g, '\n');
    };
  }

  /**
   * @protected
   * @param {import('modify-xml').Element} node The node to handle.
   */
  sortedAttributeValues(node) {
    if (!ProjectConfig.sortXMLAttributes) return attributeValues(node);

    return Object.fromEntries(
      Object.entries(attributeValues(node)).sort((a, b) => (b > a ? -1 : 1))
    );
  }

  /**
   * Returns the XML builder to use based on the current {@link Transformer#direction}.
   * @type {function(object: Object): string}
   */
  get builder() {
    return this.direction === TransformDirection.FromDB
      ? this._fromDBBuilder
      : this._fromFilesystemBuilder;
  }

  /**
   * Parses XML in a node's contents.
   * @param {Node} node The node to process.
   */
  decodeContents(node) {
    const rawLines =
      this.direction === TransformDirection.FromDB ? node.value.value.toString() : node.stringValue;

    try {
      return parse(rawLines);
    } catch (error) {
      if (error.line) {
        Object.assign(error, {
          rawLines,
          location: {
            start: {
              line: error.line + 1,
              column: error.column + 1,
            },
          },
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
