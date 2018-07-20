import { basename } from 'path';
import Logger from 'gulplog';
import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import XMLTransformer from '../lib/transform/XMLTransformer';
import {
  findChild, findChildren,
  textContent,
  createElement, createTextNode, createCDataNode,
} from '../lib/helpers/xml';

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export default class ScriptTransformer extends XMLTransformer {

  /**
   * Returns `true` for all files containing script code or quick dynamics.
   * @param {Node} node The file to check.
   * @return {boolean} `true` for all files containing script code or quick dynamics.
   */
  shouldBeTransformed(node) {
    return (node.isVariable && (node.isScript || node.isQuickDynamic)) ||
      super.shouldBeTransformed(node);
  }

  /**
   * Splits any read nodes containing scripts or quick dynamics into their JavaScript sources,
   * alongside with a json file containing parameters and metadata.
   * @param {Node} node The script node to split.
   * @param {string} enc The encoding used.
   * @param {function(err: Error, node: Node)} callback Called with the error that occured
   * while transforming the script, or the node passed through.
   */
  transformFromDB(node, enc, callback) {
    this.decodeContents(node, (err, results) => {
      if (err) {
        callback(err);
      } else {
        const document = results && findChild(results, 'script');

        if (!document) {
          Logger.warn(`Empty document at ${node.nodeId}`);
        }

        const config = {};

        // Extract metadata
        const metaTag = findChild(document, 'metadata');
        if (metaTag && metaTag.elements) {
          // TODO: Warn on multiple metadata tags
          metaTag.elements.forEach(child => {
            if (child.type === 'element') {
              if (child.name === 'icon') { // - Icon
                config.icon = Object.assign({
                  content: textContent(child) || '',
                }, child.attributes);
              } else if (child.name === 'visible') { // - Visible
                config.visible = Boolean(parseInt(textContent(child), 10));
              } else if (child.name === 'title') {
                config.title = textContent(child);
              } else if (child.name === 'description') {
                config.description = textContent(child);
              } else {
                if (!config.metadata) {
                  config.metadata = {};
                }

                const value = textContent(child);

                if (config.metadata[child.name]) {
                  if (!Array.isArray(config.metadata[child.name])) {
                    config.metadata[child.name] = [config.metadata[child.name]];
                  }

                  config.metadata[child.name].push(value);
                } else {
                  config.metadata[child.name] = textContent(child);
                }

                if (![
                  'longrunning',
                ].includes(child.name)) {
                  Logger.debug(`Generic metadata element '${child.name}' at ${node.nodeId}`);
                }
              }
            }
          });
        }

        // Extract Parameters
        const paramTags = findChildren(document, 'parameter');
        if (paramTags.length) {
          config.parameters = [];
          paramTags.forEach(({ attributes, elements }) => {
            const param = Object.assign({}, attributes);

            // Handle relative parameter targets
            if (attributes.relative === 'true') {
              param.target = {};

              const target = findChild(elements[0],
                ['Elements', 'RelativePathElement', 'TargetName']);

              if (target) {
                const [index, name] = ['NamespaceIndex', 'Name']
                  .map(tagName => textContent(findChild(target, tagName)));

                const parsedIndex = parseInt(index, 10);

                param.target = { namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex, name };
              }
            }

            config.parameters.push(param);
          });
        }

        // Extract JavaScript
        const codeNode = findChild(document, 'code');
        const code = textContent(codeNode) || '';

        // Write config file
        const configFile = ScriptTransformer.splitFile(node, '.json');
        configFile.value = {
          dataType: DataType.String,
          arrayType: VariantArrayType.Scalar,
          value: JSON.stringify(config, null, '  '),
        };

        this.push(configFile);

        // Write script file
        const scriptFile = ScriptTransformer.splitFile(node, '.js');
        scriptFile.value = {
          dataType: DataType.String,
          arrayType: VariantArrayType.Scalar,
          value: code,
        };

        this.push(scriptFile);

        node.renameTo(`${node.name}.${node.isQuickDynamic ? 'qd' : 'script'}`);

        callback(null, node);
      }
    });
  }

  /**
   * Creates a script from the collected files.
   * @param {Node} node The last file read. *Used for error messages only*.
   * @param {Map<string, Node>} sources The collected source nodes, stored against their extension.
   * @param {function(err: ?Error, data: Node)} callback Called with the error that occured
   * while creating the script or the resulting file.
   */
  createCombinedFile(node, sources, callback) {
    node.renameTo(basename(node.name, node.isQuickDynamic ? '.qd' : '.script'));

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

    const scriptFile = sources['.js'];
    let code = '';

    if (scriptFile) {
      code = scriptFile.stringValue;
    }

    const document = createElement('script', []);

    const result = {
      elements: [
        document,
      ],
    };

    // Insert metadata
    const meta = [];

    if (node.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;

        meta.push(createElement('icon', [createTextNode(icon)], config.icon));
      }

      // - Other fields
      if (config.visible !== undefined) {
        meta.push(createElement('visible', [createTextNode(`${config.visible ? 1 : 0}`)]));
      }

      if (config.title !== undefined) {
        meta.push(createElement('title', [createTextNode(config.title)]));
      }

      if (config.description !== undefined) {
        meta.push(createElement('description', [createTextNode(config.description)]));
      }
    }

    // - Additional fields
    if (config.metadata !== undefined) {
      Object.entries(config.metadata)
        .forEach(([name, value]) => {
          (Array.isArray(value) ? value : [value])
            .forEach(v => meta.push(createElement(name, [createTextNode(v)])));
        });
    }

    if (node.isQuickDynamic || meta.length) {
      document.elements.push(createElement('metadata', meta));
    }

    // Insert parameters
    if (config.parameters) {
      config.parameters.forEach(attributes => {
        let elements;

        // Handle relative parameter targets
        if (attributes.relative === 'true' && attributes.target) {
          const { namespaceIndex, name } = attributes.target;
          const targetElements = createElement('Elements');

          elements = [createElement('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.elements = [
              createElement('RelativePathElement', [
                createElement('TargetName', [
                  createElement('NamespaceIndex', [createTextNode(`${namespaceIndex}`)]),
                  createElement('Name', [createTextNode(`${name}`)]),
                ]),
              ]),
            ];
          }

          // eslint-disable-next-line no-param-reassign
          delete attributes.target;
        }

        document.elements.push(createElement('parameter', elements, attributes));
      });
    }

    // Insert script code
    document.elements.push(createElement('code', [createCDataNode(code)]));

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

}
