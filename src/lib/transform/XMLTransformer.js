import { parseString as parseXML, Builder as XMLBuilder } from 'xml2js';
import Transformer, { TransformDirection } from './Transformer';

/**
 * A transformer used to transform XML documents.
 */
export default class XMLTransformer extends Transformer {

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
    this._fromDBBuilder = new XMLBuilder({ cdata: false });

    /**
     * The builder to use with direction {@link TransformDirection.FromFilesystem}.
     * @type {xml2js~Builder}
     */
    this._fromFilesystemBuilder = new XMLBuilder({
      renderOpts: {
        pretty: true,
        indent: ' ',
        newline: '\r\n',
      },
      xmldec: {
        version: '1.0',
        encoding: 'UTF-8',
        standalone: false,
      },
      cdata: false,
    });
  }

  /**
   * Returns the XML builder instance to use base on the current {@link Transformer#direction}.
   * @type {xml2js~Builder}
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
    parseXML(file.contents, callback);
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
