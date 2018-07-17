import { Writable } from 'stream';
import { join } from 'path';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { outputFile } from 'fs-extra';
import Logger from 'gulplog';
import { encodeVariant } from '../coding';

export class WriteStream extends Writable {

  constructor(options) {
    if (!options.path) {
      throw new Error('Missing `path` option');
    }

    super(Object.assign({}, options, { objectMode: true, highWaterMark: 10000 }));

    this._processed = 0;
    this._written = 0;
    this._destroyed = false;
    this._base = join(process.cwd(), options.path);
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  _write(node, enc, callback) {
    // TODO: Throw if node.name ends with '.inner'
    const dirPath = node.filePath;

    const writeOps = [];

    if (node.nodeId !== node.id.value) {
      Logger.info(`Resolved ID conflict: '${node.id.value}' should be renamed to '${node.nodeId}'`);

      Object.assign(node, { specialId: node.id.value });
    }

    // Write definition file (if needed)
    if (node.hasUnresolvedMetadata) {
      const name = node.nodeClass === NodeClass.Variable ?
        `./.${node.fileName}.json` :
        `./${node.fileName}/.${node.nodeClass.key}.json`;

      writeOps.push(
        outputFile(join(this._base, dirPath.join('/'), name),
          JSON.stringify(node.metadata, null, '  '))
      );
    }

    // Write value
    if (node.nodeClass === NodeClass.Variable) {
      if (node.value) {
        writeOps.push(
          outputFile(join(this._base, dirPath.join('/'), node.fileName), encodeVariant(node.value))
        );

        // Store child nodes as file.inner/...
        Object.assign(node, { fileName: `${node.fileName}.inner` });
      } else {
        throw new Error('Missing value');
      }
    }

    Promise.all(writeOps)
      .then(() => callback())
      .catch(err => callback(err))
      .then(() => {
        this._processed++;
        this._written += writeOps.length;
      });
  }

  _writev(nodes, callback) {
    if (this.isDestroyed) { return; }

    Promise.all(nodes.map(({ chunk, encoding }) => new Promise((resolve, reject) => {
      this._write(chunk, encoding, err => {
        if (err) { return reject(err); }
        return resolve();
      });
    })))
      .then(() => callback())
      .catch(err => callback(err));
  }

  _destroy(err, callback) {
    this._isDestroyed = true;
    super._destroy(err, callback);
  }

}

export default function dest(path) {
  return new WriteStream({ path });
}
