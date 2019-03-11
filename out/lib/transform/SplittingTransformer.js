"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

var _fsExtra = require("fs-extra");

var _PartialTransformer = _interopRequireDefault(require("./PartialTransformer.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer that splits a node into multiple source nodes when pulling.
 */
class SplittingTransformer extends _PartialTransformer.default {
  /**
   * The extension to add to container node names when they are pulled.
   * @abstract
   * @type {string}
   */
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
        noWrite: true
      })
    });
    return node.createChild({
      extension: newExtension
    });
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


  combineNodes(node, sourceNodes) {
    // eslint-disable-line no-unused-vars
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
    node.renameTo((0, _path.basename)(node.name, this.constructor.extension));
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

    const regExp = new RegExp(`^\\.${name}(\\..*)\\.json$`);
    const children = (await (0, _fsExtra.readdir)(node.relative)).filter(c => c.match(regExp));
    const sourceNodes = await Promise.all(children.map(f => context.readNode({
      path: (0, _path.join)(node.relative, f),
      tree: {
        parent: node
      }
    })));

    this._combineNodes(node, sourceNodes.reduce((result, n) => Object.assign(result, {
      [(0, _path.extname)(n.fileName)]: n
    }), {}));
  }

}

exports.default = SplittingTransformer;
//# sourceMappingURL=SplittingTransformer.js.map