import { extname, basename, join } from 'path';
import { readdir } from 'fs-extra';
import PartialTransformer from './PartialTransformer.js';

export default class ModernSplittingTransformer extends PartialTransformer {

  static get extension() {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Splits a {@link Node}: The resulting is a clone of the input file, with a different path.
   * @param {Node} node The file to split.
   * @param {?String} newExtension The extension the resulting file gets.
   * @return {Node} The resulting node.
   */
  static splitFile(node, newExtension) {
    Object.assign(node, {
      fullyMapped: true,
      value: Object.assign(node.value, {
        noWrite: true,
      }),
    });

    return node.createChild({ extension: newExtension });
  }

  async transformFromDB(node) {
    node.renameTo(`${node.name}${this.constructor.extension}`);
  }

  readNodeFile(node) {
    return this.shouldBeTransformed(node) ? false : undefined;
  }

  combineNodes(node, sourceNodes) { // eslint-disable-line no-unused-vars
    throw new Error('Must be implemented by all subclasses');
  }

  _combineNodes(node, sourceNodes) {
    this.combineNodes(node, sourceNodes);
    node.renameTo(basename(node.name, this.constructor.extension));
  }

  async transformFromFilesystem(node, context) {
    if (!this.shouldBeTransformed(node)) { return; }


    const [name, hasExtension] = node.fileName.split(this.constructor.extension);

    if (hasExtension !== '') { // FIXME: Remove
      throw new Error(`${node.relative} shouldn't be transformed`);
    }

    const regExp = new RegExp(`^\\.${name}(\\..*)\\.json$`);
    const children = (await readdir(node.relative))
      .filter(c => c.match(regExp));


    const sourceNodes = await Promise.all(children
      .map(f => context.readNode({
        path: join(node.relative, f),
        tree: { parent: node },
      }))
    );


    this._combineNodes(node, sourceNodes
      .reduce((result, n) => Object.assign(result, {
        [extname(n.fileName)]: n,
      }), {}));
  }

}

