import { parseString as parseXML, Builder as XMLBuilder } from 'xml2js';
import Transformer, { TransformDirection } from './Transformer';

export default class XMLTransformer extends Transformer {

  constructor(options) {
    super(options);

    this._fromDBBuilder = new XMLBuilder({ cdata: false });

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

  get builder() {
    return this.direction === TransformDirection.FromDB ?
      this._fromDBBuilder :
      this._fromFilesystemBuilder;
  }

  decodeContents(file, callback) {
    parseXML(file.contents, callback);
  }

  encodeContents(object, callback) {
    try {
      callback(null, this.builder.buildObject(object));
    } catch (e) {
      callback(e);
    }
  }

}
