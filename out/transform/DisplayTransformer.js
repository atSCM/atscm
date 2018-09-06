'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _nodeclass = require('node-opcua/lib/datamodel/nodeclass');

var _variant = require('node-opcua/lib/datamodel/variant');

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _XMLTransformer = require('../lib/transform/XMLTransformer');

var _XMLTransformer2 = _interopRequireDefault(_XMLTransformer);

var _xml = require('../lib/helpers/xml');

var _Node = require('../lib/model/Node');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Names of the tags to come before <metadata> in output files.
 * @type {Set<string>}
 */
const tagsBeforeMetadata = new Set(['defs', 'desc', 'title']);

/**
 * Returns the index at which the <metadata> section should be inserted in the resulting xml.
 * @param {Object[]} elements The elements to look at.
 * @return {number} The insertion index.
 */
function metadataIndex(elements) {
  let index = 0;

  while (elements.length > index && tagsBeforeMetadata.has(elements[index].name)) {
    index += 1;
  }

  return index;
}

/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
class DisplayTransformer extends _XMLTransformer2.default {

  /**
   * Returns true for all nodes containing atvise displays.
   * @param {Node} node The node to check.
   * @return {boolean} `true` for all atvise display nodes.
   */
  shouldBeTransformed(node) {
    return node.hasTypeDefinition('VariableTypes.ATVISE.Display') || super.shouldBeTransformed(node);
  }

  /**
   * Splits any read files containing atvise displays into their SVG and JavaScript sources,
   * alongside with a json file containing the display's parameters.
   * @param {Node} node The display node to split.
   * @param {string} enc The encoding used.
   * @param {function(err: Error, node: Node)} callback Called with the error that occured
   * while transforming the display, or the node passed through.
   */
  transformFromDB(node, enc, callback) {
    if (node.arrayType !== _variant.VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of displays not supported');
    }
    node.markAsResolved('nodeClass');
    node.markAsResolved('dataType');
    node.markAsResolved('arrayType');
    node.markReferenceAsResolved('HasTypeDefinition', 'VariableTypes.ATVISE.Display');

    this.decodeContents(node, (err, results) => {
      if (err) {
        callback(err);
      } else if (!results) {
        callback(new Error('Error parsing display: No `svg` tag'));
      } else {
        const xml = results;
        const document = (0, _xml.findChild)(xml, 'svg');

        if (!document) {
          callback(new Error('Error parsing display: No `svg` tag'));
          return;
        }

        const config = {};
        const scriptTags = (0, _xml.removeChildren)(document, 'script');
        let inlineScript = false;

        // Extract JavaScript
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
                _gulplog2.default.warn(`'${node.id.value}' contains multiple inline scripts.`);
                document.elements.push(inlineScript);
              }
              inlineScript = script;
            }
          });
        }
        if (inlineScript) {
          const contentNode = inlineScript.elements ? inlineScript.elements[0] : (0, _xml.createTextNode)();
          const scriptFile = DisplayTransformer.splitFile(node, '.js');
          const scriptText = contentNode[contentNode.type] || '';

          scriptFile.value = {
            dataType: _variant.DataType.String,
            arrayType: _variant.VariantArrayType.Scalar,
            value: scriptText
          };
          this.push(scriptFile);
        }

        // Extract metadata
        const metaTag = (0, _xml.findChild)(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags

          // - Parameters
          const paramTags = (0, _xml.removeChildren)(metaTag, 'atv:parameter');
          if (paramTags.length) {
            config.parameters = [];

            paramTags.forEach(({ attributes }) => config.parameters.push(attributes));
          }
        }

        const configFile = DisplayTransformer.splitFile(node, '.json');

        configFile.value = {
          dataType: _variant.DataType.String,
          arrayType: _variant.VariantArrayType.Scalar,
          value: JSON.stringify(config, null, '  ')
        };
        this.push(configFile);

        const svgFile = DisplayTransformer.splitFile(node, '.svg');

        this.encodeContents(xml, (encodeErr, stringValue) => {
          if (encodeErr) {
            callback(encodeErr);
          } else {
            svgFile.value = {
              dataType: _variant.DataType.String,
              arrayType: _variant.VariantArrayType.Scalar,
              value: stringValue
            };
            this.push(svgFile);

            node.renameTo(`${node.name}.display`);

            callback(null, node);
          }
        });
      }
    });
  }

  /**
   * Creates a display from the collected source nodes.
   * @param {Node} node The node to map to.
   * @param {Map<String, Node>} sources The collected files, stored against their extension.
   * @param {function(err: ?Error, data: Node)} callback Called with the error that occured
   * while creating the display or the resulting file.
   */
  createCombinedFile(node, sources, callback) {
    /* eslint-disable no-param-reassign */

    // FIXME: Set nodeClass to NodeClass.Variable
    node.nodeClass = _nodeclass.NodeClass.Variable;
    node.markAsResolved('nodeClass');

    // Set dataType to DataType.XmlElement
    node.value.dataType = _variant.DataType.XmlElement;
    node.markAsResolved('dataType');

    // Set arrayType to 'Scalar'
    node.value.arrayType = _variant.VariantArrayType.Scalar;
    node.markAsResolved('arrayType');

    // Set type definition reference to 'VariableTypes.ATVISE.Display'
    node.setReferences(_Node.ReferenceTypeIds.HasTypeDefinition, ['VariableTypes.ATVISE.Display']);
    node.markAllReferencesAsResolved('HasTypeDefinition');

    /* eslint-enable no-param-reassign */

    node.renameTo((0, _path.basename)(node.name, '.display'));

    const configFile = sources['.json'];
    let config = {};

    if (configFile) {
      try {
        config = JSON.parse(configFile.stringValue);
      } catch (e) {
        callback(new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`));
        return;
      }
    }

    const svgFile = sources['.svg'];
    if (!svgFile) {
      callback(new Error(`No display SVG in ${svgFile.path}`));
      return;
    }

    const scriptFile = sources['.js'];
    let inlineScript = '';
    if (scriptFile) {
      inlineScript = scriptFile.stringValue;
    }

    this.decodeContents(svgFile, (err, xml) => {
      if (err) {
        callback(err);
      } else {
        const result = xml;
        const svg = (0, _xml.findChild)(result, 'svg');

        if (!svg) {
          callback(new Error('Error parsing display SVG: No `svg` tag'));
          return;
        }

        // Handle empty svg tag
        if (!svg.elements) {
          svg.elements = [];
        }

        // Insert dependencies
        if (config.dependencies) {
          config.dependencies.forEach(src => {
            svg.elements.push((0, _xml.createElement)('script', undefined, { 'xlink:href': src }));
          });
        }

        // Insert script
        // FIXME: Import order is not preserved!
        if (scriptFile) {
          svg.elements.push((0, _xml.createElement)('script', [(0, _xml.createCDataNode)(inlineScript)], {
            type: 'text/ecmascript'
          }));
        }

        // Insert metadata
        // - Parameters
        if (config.parameters && config.parameters.length > 0) {
          let metaTag = (0, _xml.removeChild)(svg, 'metadata');

          if (!metaTag) {
            metaTag = (0, _xml.createElement)('metadata');
          }

          if (!metaTag.elements) {
            metaTag.elements = [];
          }

          // Parameters should come before other atv attributes, e.g. `atv:gridconfig`
          for (let i = config.parameters.length - 1; i >= 0; i--) {
            metaTag.elements.unshift((0, _xml.createElement)('atv:parameter', undefined, config.parameters[i]));
          }

          // Insert <metadata> as first element in the resulting svg, after <defs>, <desc> and
          // <title> if defined
          svg.elements.splice(metadataIndex(svg.elements), 0, metaTag);
        }

        this.encodeContents(result, (encodeErr, xmlString) => {
          if (encodeErr) {
            callback(encodeErr);
          } else {
            // eslint-disable-next-line no-param-reassign
            node.value.value = xmlString;

            callback(null, node);
          }
        });
      }
    });
  }

}
exports.default = DisplayTransformer;
//# sourceMappingURL=DisplayTransformer.js.map