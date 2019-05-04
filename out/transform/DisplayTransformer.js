"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _variant = require("node-opcua/lib/datamodel/variant");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _modifyXml = require("modify-xml");

var _XMLTransformer = _interopRequireDefault(require("../lib/transform/XMLTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
class DisplayTransformer extends _XMLTransformer.default {
  /**
   * The extension to add to display container node names when they are pulled.
   * @type {string}
   */
  static get extension() {
    return '.display';
  }
  /**
   * The source file extensions to allow.
   * @type {string[]}
   */


  static get sourceExtensions() {
    return ['.json', '.svg', '.js'];
  }
  /**
   * Returns `true` for all display nodes.
   * @param {Node} node The node to check.
   */


  shouldBeTransformed(node) {
    return node.hasTypeDefinition('VariableTypes.ATVISE.Display');
  }
  /**
   * Splits any read files containing atvise displays into their SVG and JavaScript sources,
   * alongside with a json file containing the display's parameters.
   * @param {BrowsedNode} node The node to split.
   * @param {Object} context The transform context.
   */


  async transformFromDB(node, context) {
    if (!this.shouldBeTransformed(node)) {
      return undefined;
    }

    if (node.arrayType !== _variant.VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of displays not supported');
    }

    const xml = this.decodeContents(node);

    if (!xml) {
      throw new Error('Error parsing display');
    }

    const document = (0, _modifyXml.findChild)(xml, 'svg');

    if (!document) {
      throw new Error('Error parsing display: No `svg` tag');
    }

    const config = {};
    const scriptTags = (0, _modifyXml.removeChildren)(document, 'script');
    let inlineScript; // Extract JavaScript

    if (scriptTags.length) {
      scriptTags.forEach(script => {
        if (script.attributes && (script.attributes.src || script.attributes['xlink:href'])) {
          if (!config.dependencies) {
            config.dependencies = [];
          }

          config.dependencies.push(script.attributes.src || script.attributes['xlink:href']);
        } else {
          // Warn on multiple inline scripts
          if (inlineScript) {
            _gulplog.default[node.id.value.startsWith('SYSTEM.LIBRARY.ATVISE') ? 'debug' : 'warn'](`'${node.id.value}' contains multiple inline scripts.`);

            document.elements.push(inlineScript);
          }

          inlineScript = script;
        }
      });
    }

    if (inlineScript) {
      const scriptFile = this.constructor.splitFile(node, '.js');
      const scriptText = (0, _modifyXml.textContent)(inlineScript);
      scriptFile.value = {
        dataType: _variant.DataType.String,
        arrayType: _variant.VariantArrayType.Scalar,
        value: scriptText
      };
      context.addNode(scriptFile);
    } // Extract metadata


    const metaTag = (0, _modifyXml.findChild)(document, 'metadata');

    if (metaTag && metaTag.childNodes) {
      // TODO: Warn on multiple metadata tags
      // - Parameters
      const paramTags = (0, _modifyXml.removeChildren)(metaTag, 'atv:parameter');

      if (paramTags.length) {
        config.parameters = [];
        paramTags.forEach(({
          attributes
        }) => config.parameters.push(attributes));
      }
    }

    const configFile = this.constructor.splitFile(node, '.json');
    configFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: JSON.stringify(config, null, '  ')
    };
    context.addNode(configFile);
    const svgFile = this.constructor.splitFile(node, '.svg');
    svgFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: this.encodeContents(xml)
    };
    context.addNode(svgFile); // equals: node.renameTo(`${node.name}.display`);

    return super.transformFromDB(node);
  }
  /**
   * Creates a display from the collected nodes.
   * @param {BrowsedNode} node The container node.
   * @param {Map<string, BrowsedNode>} sources The collected files, stored against their
   * extension.
   */


  combineNodes(node, sources) {
    const configFile = sources['.json'];
    let config = {};

    if (configFile) {
      try {
        config = JSON.parse(configFile.stringValue);
      } catch (e) {
        throw new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`);
      }
    }

    const svgFile = sources['.svg'];

    if (!svgFile) {
      throw new Error(`No display SVG for ${node.nodeId}`);
    }

    const scriptFile = sources['.js'];
    let inlineScript = '';

    if (scriptFile) {
      inlineScript = scriptFile.stringValue;
    }

    const xml = this.decodeContents(svgFile);
    const result = xml;
    const svg = (0, _modifyXml.findChild)(result, 'svg');

    if (!svg) {
      throw new Error('Error parsing display SVG: No `svg` tag');
    } // Insert dependencies


    if (config.dependencies) {
      config.dependencies.forEach(s => {
        (0, _modifyXml.appendChild)(svg, (0, _modifyXml.createElement)('script', undefined, {
          'xlink:href': s
        }));
      });
    } // Insert script
    // FIXME: Import order is not preserved!


    if (scriptFile) {
      (0, _modifyXml.appendChild)(svg, (0, _modifyXml.createElement)('script', [(0, _modifyXml.createCDataNode)(inlineScript)], {
        type: 'text/ecmascript'
      }));
    } // Insert metadata
    // - Parameters


    if (config.parameters && config.parameters.length > 0) {
      let [metaTag] = (0, _modifyXml.removeChildren)(svg, 'metadata'); // FIXME: Warn on multiple metadata tags

      if (!metaTag) {
        metaTag = (0, _modifyXml.createElement)('metadata');
      } // Parameters should come before other atv attributes, e.g. `atv:gridconfig`


      for (let i = config.parameters.length - 1; i >= 0; i--) {
        (0, _modifyXml.prependChild)(metaTag, (0, _modifyXml.createElement)('atv:parameter', undefined, config.parameters[i]));
      } // Insert <metadata> as first element in the resulting svg, after <defs>, <desc> and
      // <title> if defined (nothing to do, they are ordered inside #encodeContents)


      (0, _modifyXml.prependChild)(svg, metaTag);
    } // eslint-disable-next-line


    node.value.value = this.encodeContents(result);
    return node;
  }

}

exports.default = DisplayTransformer;
//# sourceMappingURL=DisplayTransformer.js.map