import { Buffer } from 'buffer';
import expect from 'unexpected';
import { TransformDirection } from '../../src/lib/transform/Transformer';
import AtviseFile from '../../src/lib/server/AtviseFile';

export default class TransformerHelper {

  constructor(TransformerClass) {
    this.TransformerClass = TransformerClass;
  }

  writeToTransformer(path, stringContents, direction) {
    const transformer = new this.TransformerClass({ direction });
    const file = new AtviseFile({
      path,
      contents: Buffer.from(stringContents),
    });

    const data = [];
    transformer.on('data', d => data.push(d));

    const promise = new Promise((resolve, reject) => {
      transformer.once('error', err => reject(err));
      transformer.once('end', () => resolve(data));
    });

    transformer.write(file);
    transformer.end();

    return promise;
  }

  writeXMLToTransformer(path, xmlString, direction = TransformDirection.FromDB) {
    return this.writeToTransformer(path, `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${xmlString}`, direction);
  }

  expectFileContents(files) {
    return Promise.all(
      files.map(file => expect(file, 'to be an', 'object')
        .then(() => expect(file.contents, 'when decoded as', 'utf-8'))
      )
    );
  }

  createCombinedFileWithContents(path, contents, direction = TransformDirection.FromFilesystem) {
    const transformer = new this.TransformerClass({ direction });
    let lastFile;
    const files = Object.keys(contents).reduce((prev, ext) => {
      const result = prev;

      result[ext] = new AtviseFile({
        path: `${path}${ext}`,
        contents: Buffer.from(contents[ext]),
      });

      lastFile = result[ext];
      return result;
    }, {});

    return cb => transformer.createCombinedFile(files, lastFile, cb);
  }

}
