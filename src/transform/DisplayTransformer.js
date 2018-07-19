import { basename } from 'path';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import XMLTransformer from '../lib/transform/XMLTransformer';
import {
  findChild, removeChild,
  removeChildren,
  createTextNode, createCDataNode, createElement,
} from '../lib/helpers/xml';
import { ReferenceTypeIds } from '../lib/model/Node';

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
export default class DisplayTransformer extends XMLTransformer {

  /**
   * Returns true for all nodes containing atvise displays.
   * @param {Node} node The node to check.
   * @return {boolean} `true` for all atvise display nodes.
   */
  shouldBeTransformed(node) {
    return node.hasTypeDefinition('VariableTypes.ATVISE.Display') ||
      super.shouldBeTransformed(node);
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
    if (node.arrayType !== VariantArrayType.Scalar) {
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
        const document = findChild(xml, 'svg');

        if (!document) {
          callback(new Error('Error parsing display: No `svg` tag'));
          return;
        }

        const config = {};
        const scriptTags = removeChildren(document, 'script');

        // Extract JavaScript
        if (scriptTags.length) {
          scriptTags.forEach(script => {
            if (script.attributes && (script.attributes.src || script.attributes['xlink:href'])) {
              if (!config.dependencies) {
                config.dependencies = [];
              }

              config.dependencies.push(script.attributes.src || script.attributes['xlink:href']);
            } else {
              // TODO: Warn on multiple inline scripts

              const scriptContentNode = script.elements ? script.elements[0] : createTextNode();

              const scriptFile = DisplayTransformer.splitFile(node, '.js');

              const scriptText = scriptContentNode[scriptContentNode.type] || '';

              scriptFile.value = {
                dataType: DataType.String,
                arrayType: VariantArrayType.Scalar,
                value: scriptText,
              };
              this.push(scriptFile);
            }
          });
        }

        // Extract metadata
        const metaTag = findChild(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags

          // - Parameters
          const paramTags = removeChildren(metaTag, 'atv:parameter');
          if (paramTags.length) {
            config.parameters = [];

            paramTags.forEach(({ attributes }) => config.parameters.push(attributes));
          }
        }

        const configFile = DisplayTransformer.splitFile(node, '.json');

        configFile.value = {
          dataType: DataType.String,
          arrayType: VariantArrayType.Scalar,
          value: JSON.stringify(config, null, '  '),
        };
        this.push(configFile);

        const svgFile = DisplayTransformer.splitFile(node, '.svg');

        this.encodeContents(xml, (encodeErr, stringValue) => {
          if (encodeErr) {
            callback(encodeErr);
          } else {
            svgFile.value = {
              dataType: DataType.String,
              arrayType: VariantArrayType.Scalar,
              value: stringValue,
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
    node.nodeClass = NodeClass.Variable;
    node.markAsResolved('nodeClass');

    // Set dataType to DataType.XmlElement
    node.value.dataType = DataType.XmlElement;
    node.markAsResolved('dataType');

    // Set arrayType to 'Scalar'
    node.value.arrayType = VariantArrayType.Scalar;
    node.markAsResolved('arrayType');

    // Set type definition reference to 'VariableTypes.ATVISE.Display'
    node.setReferences(ReferenceTypeIds.HasTypeDefinition, ['VariableTypes.ATVISE.Display']);
    node.markAllReferencesAsResolved('HasTypeDefinition');

    /* eslint-enable no-param-reassign */

    node.renameTo(basename(node.name, '.display'));

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
        const svg = findChild(result, 'svg');

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
            svg.elements.push(createElement('script', undefined, { 'xlink:href': src }));
          });
        }

        // Insert script
        // FIXME: Import order is not preserved!
        if (scriptFile) {
          svg.elements.push(createElement('script', [createCDataNode(inlineScript)], {
            type: 'text/ecmascript',
          }));
        }

        // Insert metadata
        // - Parameters
        if (config.parameters && config.parameters.length > 0) {
          let metaTag = removeChild(svg, 'metadata');

          if (!metaTag) {
            metaTag = createElement('metadata');
          }

          if (!metaTag.elements) {
            metaTag.elements = [];
          }

          // Parameters should come before other atv attributes, e.g. `atv:gridconfig`
          for (let i = config.parameters.length - 1; i >= 0; i--) {
            metaTag.elements.unshift(
              createElement('atv:parameter', undefined, config.parameters[i])
            );
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
