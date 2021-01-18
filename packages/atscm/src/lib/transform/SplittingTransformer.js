import { extname, basename, join } from 'path';
import { readdir } from 'fs-extra';
import PartialTransformer from './PartialTransformer.js';

/**
 * A transformer that splits a node into multiple source nodes when pulling.
 */
export default class SplittingTransformer extends PartialTransformer {
  /**
   * The extension to add to container node names when they are pulled.
   * @abstract
   * @type {string}
   */
  static get extension() {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * The source file extensions to allow.
   * @abstract
   * @type {string[]}
   */
  static get sourceExtensions() {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Splits a {@link Node}: The resulting is a clone of the input file, with a different path.
   * @param {Node} node The file to split.
   * @param {?string} newExtension The extension the resulting file gets.
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

  /**
   * Renames a container node, should be called by all subclasses.
   * @param {BrowsedNode} node A container node.
   */
  async transformFromDB(node) {
    node.renameTo(`${node.name}${this.constructor.extension}`);
  }

  /**
   * Returns `false` for all container nodes, so they don't get read.
   * @param {BrowsedNode} node The node to check.
   * @return {?boolean} If the node should be read.
   */
  readNodeFile(node) {
    return this.shouldBeTransformed(node) ? false : undefined;
  }

  /**
   * Combines the container node and the source nodes to one single node.
   * @abstract
   * @param {BrowsedNode} node The container node.
   * @param {Map<string, BrowsedNode>} sourceNodes The source nodes.
   */
  // eslint-disable-next-line no-unused-vars
  combineNodes(node, sourceNodes) {
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Combines the container node and the source nodes to one single node by calling
   * {@link SplittingTransformer#combineNodes}.
   * @param {BrowsedNode} node The container node.
   * @param {{ [extension: string]: BrowedNode }} sourceNodes The source nodes.
   */
  _combineNodes(node, sourceNodes) {
    this.combineNodes(node, sourceNodes);
    node.renameTo(basename(node.name, this.constructor.extension));
  }

  /**
   * Reads a given container nodes source nodes and combines them.
   * @param {BrowsedNode} node The node to transform.
   * @param {Object} context The browser context.
   */
  async transformFromFilesystem(node, context) {
    if (!this.shouldBeTransformed(node)) {
      return;
    }

    const [name, hasExtension] = node.fileName.split(this.constructor.extension);

    if (hasExtension !== '') {
      // FIXME: Remove
      throw new Error(`${node.relative} shouldn't be transformed`);
    }

    const regExp = new RegExp(
      `^\\.${name
        .replace(/\[/, '\\[')
        .replace(/\]/, '\\]')}(${this.constructor.sourceExtensions.join('|')})\\.json$`
    );

    // Find source files an child definition files
    const sourceFiles = [];
    const childFiles = [];

    const children = (await readdir(node.relative)).reduce((current, f) => {
      if (f.match(regExp)) {
        sourceFiles.push(f);
      } else if (f.match(/^\..*\.json$/)) {
        // Other definition file -> child node
        current.push({ name: f, path: join(node.relative, f) });
        childFiles.push(f);
      } else if (!sourceFiles.includes(`.${f}.json`) && !childFiles.includes(`.${f}.json`)) {
        // This might be a child object's folder...
        current.push({ name: f, path: join(node.relative, f) });
      }

      return current;
    }, []);

    // Manually set node.children for the container as source browser only handles definition files
    Object.assign(node, { children });

    const sourceNodes = await Promise.all(
      sourceFiles.map((f) =>
        context.readNode({
          path: join(node.relative, f),
          tree: { parent: node },
        })
      )
    );

    this._combineNodes(
      node,
      sourceNodes.reduce(
        (result, n) =>
          Object.assign(result, {
            [extname(n.fileName)]: n,
          }),
        {}
      )
    );
  }
}
