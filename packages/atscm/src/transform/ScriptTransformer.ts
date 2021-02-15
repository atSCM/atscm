import Logger from 'gulplog';
import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import {
  findChild,
  findChildren,
  textContent,
  createElement,
  createTextNode,
  createCDataNode,
  prependChild,
  appendChild,
  isElement,
  attributeValues,
  AttributeValues,
} from 'modify-xml';
import XMLTransformer from '../lib/transform/XMLTransformer';
import type SplittingTransformer from '../lib/transform/SplittingTransformer';
import type { ServerscriptConfig } from '../../types/schemas/serverscript-config';

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
export class AtviseScriptTransformer extends XMLTransformer {
  /**
   * The source file extension to allow for scripts.
   */
  static get scriptSourceExtension() {
    return '.js';
  }

  /**
   * The source file extensions to allow.
   * @type {string[]}
   */
  static get sourceExtensions() {
    return ['.json', this.scriptSourceExtension];
  }

  /**
   * Extracts a script's metadata.
   * @param {Object} document The parsed xml document to process.
   * @return {Object} The metadata found.
   */
  processMetadata(document) {
    const config: ServerscriptConfig = {};

    const metaTag = findChild(document, 'metadata');
    // console.error('Meta', metaTag);
    if (!metaTag || !metaTag.childNodes) {
      return config;
    }

    metaTag.childNodes.forEach((child) => {
      if (child.type !== 'element') {
        return;
      }

      switch (child.name) {
        case 'icon':
          config.icon = Object.assign(
            {
              content: textContent(child) || '',
            },
            attributeValues(child) as { [name: string]: string } & { type: string }
          );
          break;
        case 'visible':
          config.visible = Boolean(parseInt(textContent(child) || '1', 10));
          break;
        case 'title':
          config.title = textContent(child) ?? undefined;
          break;
        case 'description':
          config.description = textContent(child) ?? undefined;
          break;
        default: {
          if (!config.metadata) {
            config.metadata = {};
          }

          const value = textContent(child)!;

          if (config.metadata[child.name]) {
            const soFar = config.metadata[child.name];
            if (!Array.isArray(soFar)) {
              config.metadata[child.name] = [soFar];
            }

            (config.metadata[child.name] as string[]).push(value);
          } else {
            config.metadata[child.name] = value;
          }

          if (!['longrunning'].includes(child.name)) {
            Logger.debug(`Generic metadata element '${child.name}'`); // FIXME:  at ${node.nodeId}
          }
          break;
        }
      }
    });

    return config;
  }

  /**
   * Extracts a script's parameters.
   * @param {Object} document The parsed xml document to process.
   * @return {Object[]} The parameters found.
   */
  processParameters(document) {
    const paramTags = findChildren(document, 'parameter');
    if (!paramTags?.length) {
      return undefined;
    }

    return paramTags.map((node) => {
      const { childNodes } = node;
      const attributes = this.sortedAttributeValues(node);
      const param = Object.assign({}, attributes) as ServerscriptConfig['parameters'][0];

      // Handle relative parameter targets
      if (attributes.relative === 'true') {
        const target = findChild(childNodes.find(isElement), [
          'Elements',
          'RelativePathElement',
          'TargetName',
        ]);

        if (target) {
          const [index, name] = ['NamespaceIndex', 'Name'].map((tagName) =>
            textContent(findChild(target, tagName))
          );

          const parsedIndex = parseInt(index, 10);

          param.target = { namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex, name: name || '' };
        }
      }

      return param;
    });
  }

  /**
   * Splits a node into multiple source nodes.
   * @param {Node} node A server node.
   * @param {Object} context The current transform context.
   */
  async transformFromDB(node, context) {
    if (!this.shouldBeTransformed(node)) {
      return undefined;
    }

    if (node.arrayType !== VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of scripts not supported');
    }

    // If scripts are empty (e.g. created by atvise builder, but never edited) we display a warning and ignore them.
    if (!node.value.value) {
      Logger.warn(`The script '${node.id.value}' is empty, skipping...`);
      return context.remove(node);
    }

    const xml = this.decodeContents(node);
    if (!xml) {
      throw new Error('Error parsing script');
    }

    const document = findChild(xml, 'script');
    if (!document) {
      throw new Error(`Empty document at ${node.id.value}`);
    }

    // Extract metadata and parameters
    const config = {
      ...this.processMetadata(document),
      parameters: this.processParameters(document),
    };

    // Write config file
    const configFile = (this.constructor as typeof SplittingTransformer).splitFile(node, '.json');
    configFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: JSON.stringify(config, null, '  '),
    };
    context.addNode(configFile);

    // Write JavaScript file
    const codeNode = findChild(document, 'code');
    const scriptFile = (this.constructor as typeof SplittingTransformer).splitFile(node, '.js');
    scriptFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: textContent(codeNode) || '',
    };
    context.addNode(scriptFile);

    return super.transformFromDB(node, context);
  }

  /**
   * Inlines the passed source nodes to the given container node.
   * @param {Node} node The container node.
   * @param {{ [ext: string]: Node }} sources The source nodes to inline.
   */
  combineNodes(node, sources) {
    const configFile = sources['.json'];
    let config: ServerscriptConfig = {};

    if (configFile) {
      try {
        config = JSON.parse(configFile.stringValue);
      } catch (e) {
        throw new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`);
      }
    }

    const scriptFile =
      sources[(this.constructor as typeof AtviseScriptTransformer).scriptSourceExtension];
    let code = '';

    if (scriptFile) {
      code = scriptFile.stringValue;
    }

    const document = createElement('script', []);

    const result = {
      childNodes: [
        { type: 'directive', value: '<?xml version="1.0" encoding="UTF-8"?>' },
        document,
      ],
    };

    // Insert metadata
    const meta = [];

    if (node.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const { content, ...iconConfig } = config.icon;

        meta.push(createElement('icon', [createTextNode(content)], iconConfig as AttributeValues));
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
      Object.entries(config.metadata).forEach(([name, value]) => {
        (Array.isArray(value) ? value : [value]).forEach((v) =>
          meta.push(createElement(name, [createTextNode(v)]))
        );
      });
    }

    if (node.isQuickDynamic || meta.length) {
      prependChild(document, createElement('metadata', meta));
    }

    // Insert parameters
    if (config.parameters) {
      config.parameters.forEach((attributes) => {
        let elements;

        // Handle relative parameter targets
        if (attributes.relative === 'true') {
          const { namespaceIndex, name } = attributes.target || {};
          const targetElements = createElement('Elements');

          elements = [createElement('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.childNodes = [
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

        appendChild(document, createElement('parameter', elements, attributes as AttributeValues));
      });
    }

    // Insert script code
    appendChild(document, createElement('code', [createCDataNode(code)]));

    // eslint-disable-next-line no-param-reassign
    node.value.value = this.encodeContents(result);
  }
}

/**
 * A transformer that splits atvise server scripts into multiple files.
 */
export class ServerscriptTransformer extends AtviseScriptTransformer {
  /** The container's extension. */
  static get extension() {
    return '.script';
  }

  /**
   * Returns `true` for all script nodes.
   * @param {Node} node The node to check.
   * @return {boolean} If the node is a server script.
   */
  shouldBeTransformed(node) {
    return node.isVariable && node.isScript;
  }
}

/**
 * A transformer that splits atvise quickdynamics into multiple files.
 */
export class QuickDynamicTransformer extends AtviseScriptTransformer {
  /** The container's extension. */
  static get extension() {
    return '.qd';
  }

  /**
   * Returns `true` for all nodes containing quick dynamics.
   * @param {Node} node The node to check.
   * @return {boolean} If the node is a quick dynamic.
   */
  shouldBeTransformed(node) {
    return node.isVariable && node.isQuickDynamic;
  }
}

export class DisplayScriptTransformer extends AtviseScriptTransformer {
  /** The container's extension. */
  static get extension() {
    return '.ds';
  }

  /**
   * Returns `true` for all nodes containing quick dynamics.
   * @param {Node} node The node to check.
   * @return {boolean} If the node is a quick dynamic.
   */
  shouldBeTransformed(node) {
    return node.isVariable && node.isDisplayScript;
  }
}
