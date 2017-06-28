// import { EOL } from 'os';
import { DOMParser, XMLSerializer } from 'xmldom';
import Logger from 'gulplog';
import prettify from 'prettify-xml';
import { TransformDirection } from './Transformer';
import SplittingTransformer from './SplittingTransformer';

/**
 * A transformer used to transform XML documents.
 */
export default class XMLTransformer extends SplittingTransformer {

  /**
   * The options to create the output xml with. Returns single indent and `\r\n` newlines if running
   * from filesystem and defaults for from db.
   * @type {Object}
   * @property {?number} indent The number of spaces to indent lines with.
   * @property {?string} newline The newline to use.
   */
  get serializationOptions() {
    return this.direction === TransformDirection.FromDB ?
      { } :
      { indent: 1, newline: '\r\n' };
  }

  /**
   * Parses xmldom error messages and returns the real message (without prefix, scope, ...)
   * @param {string[]} args The error handler arguments.
   * @return {string} The original error message.
   */
  _getParserErrorMessage(args) {
    const msg = args.join('');
    const m = msg.match(/\[[^ ]* (.*)\]\t(.*)\s.*line:([0-9]+),col:([0-9+])/);

    if (m) {
      return m[2];
    }

    return msg;
  }

  /**
   * Return the currently processed file path, line and column.
   * @param {DOMParser} parser The DOMParser instance currently used.
   * @param {AtviseFile} file The file currently processed.
   * @return {Object} The error info.
   * @property {number} line The current line.
   * @property {number} column The current column.
   * @property {string} path The path of the file currently processed.
   */
  _getParserErrorInfo(parser, file) {
    const { lineNumber: line, columnNumber: column } = parser.options.locator;
    return { line, column, path: file.relative };
  }

  /**
   * Returns an error message and info.
   * @param {string[]} args The error handler arguments.
   * @param {DOMParser} parser The DOMParser instance currently used.
   * @param {AtviseFile} file The file currently processed.
   * @return {{message: string, info: { line: number, column: number }}} The error.
   */
  _getParserError(args, parser, file) {
    return {
      message: this._getParserErrorMessage(args),
      info: this._getParserErrorInfo(parser, file),
    };
  }

  /**
   * Parses XML in a file's contents.
   * @param {AtviseFile} file The file to process.
   * @param {function(err: ?Error, result: ?Object)} callback Called with the parsed document or the
   * parse error that occurred.
   */
  decodeContents(file, callback) {
    let err;

    const parser = new DOMParser({
      locator: {},
      errorHandler: {
        warning: (...args) => Logger.warn(
          this._getParserErrorMessage(args), this._getParserErrorInfo(parser, file)),
        error: (...args) => {
          const { message, info } = this._getParserError(args, parser, file);

          Logger.error(message, info);
          err = new Error(`Parse error: ${message}`);
        },
        fatalError: (...args) => {
          const { message, info } = this._getParserError(args, parser, file);

          Logger.error(message, info);
          err = new Error(`Parse error: ${message}`);
        },
      },
    });

    try {
      const doc = parser.parseFromString(file.contents.toString(), 'text/xml');

      if (err) {
        callback(err);
      } else {
        callback(null, doc);
      }
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Builds an XML string from an object.
   * @param {DOMDocument} doc The document to encode.
   * @param {function(err: ?Error, result: ?String)} callback Called with the resulting string or
   * the error that occurred while building.
   */
  encodeContents(doc, callback) {
    try {
      if (!doc) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      if (doc.constructor.name !== 'Document') {
        throw new TypeError('Not a DOMDocument instance');
      }

      // Insert xml processing instruction if needed
      if (Array.from(doc.childNodes).filter(n => n.nodeType === 7).length === 0) {
        doc.insertBefore(
          doc.createProcessingInstruction('xml',
            'version="1.0" encoding="UTF-8" standalone="no"'),
          doc.firstChild
        );
      }

      // Insert xmlns' if missing
      if (doc.documentElement) {
        doc.documentElement.setAttribute('xmlns:atv', 'http://webmi.atvise.com/2007/svgext');
        doc.documentElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      } else {
        throw new Error('Missing document element');
      }

      const ns = {};
      const str = (new XMLSerializer()).serializeToString(doc)
        // Remove additional namespace declarations
        .replace(/(\s?xmlns:([a-z]+)="([^"]+)")/g, (match, _, name) => {
          if (ns[name]) {
            return '';
          }

          ns[name] = true;

          return match;
        });

      callback(null, prettify(str, this.serializationOptions));
    } catch (e) {
      callback(e);
    }
  }

  /**
   * Creates a new node in the given document.
   * @param {DOMDocument} doc The document to create the node in.
   * @param {string} name The tag name of the new element.
   * @param {Map<string, *>} [attributes] The attributes to assign.
   * @param {string} [attributes.textContent] The text content to assign to the new node.
   * @return {DOMElement} The new dom element.
   */
  createNode(doc, name, attributes = {}) {
    const n = doc.createElement(name);

    Object.keys(attributes).forEach(a => {
      if (a === 'textContent') {
        n.textContent = attributes[a];
      } else {
        n.setAttribute(a, attributes[a]);
      }
    });

    return n;
  }

  /**
   * Creates a new node and appends it to another.
   * @param {DOMDocument} doc The document to create the node in.
   * @param {string} name The tag name of the new element.
   * @param {Map<string, *>} [attributes] The attributes to assign.
   * @param {string} [attributes.textContent] The text content to assign to the new node.
   * @param {DOMElement} [parent] The node to which the created one should be appended. Defaults to
   * the document's *documentElement*.
   * @return {DOMElement} The new dom element.
   */
  appendNode(doc, name, attributes = {}, parent) {
    const node = this.createNode(doc, name, attributes);
    (parent || doc.documentElement).appendChild(node);

    return node;
  }

  /**
   * A DOM helper that return all attributes for the given DOMElement
   * @param {DOMElement} element The element to get the attributes from.
   * @return {Map<String, String>} The element's attributes.
   */
  getElementAttributes(element) {
    return Array.from(element.attributes)
      .reduce((result, n) => Object.assign(result, {
        [n.nodeName]: n.nodeValue,
      }), {});
  }

}
