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
export class AtviseScriptTransformer extends XMLTransformer {

  processMetadata(document) {
    const config = {};

    const metaTag = findChild(document, 'metadata');
    if (!metaTag || !metaTag.elements) { return config; }

    metaTag.elements.forEach(child => {
      if (child.type !== 'element') { return; }

      switch (child.name) {
        case 'icon':
          config.icon = Object.assign({
            content: textContent(child) || '',
          }, child.attributes);
          break;
        case 'visible':
          config.visible = Boolean(parseInt(textContent(child), 10));
          break;
        case 'title':
          config.title = textContent(child);
          break;
        case 'description':
          config.description = textContent(child);
          break;
        default: {
          if (!config.metadata) { config.metadata = {}; }

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
            Logger.debug(`Generic metadata element '${child.name}'`); // FIXME:  at ${node.nodeId}
          }
          break;
        }
      }
    });

    return config;
  }

  processParameters(document) {
    const paramTags = findChildren(document, 'parameter');
    if (!paramTags.length) { return undefined; }

    return paramTags.map(({ attributes, elements }) => {
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

      return param;
    });
  }

  async transformFromDB(node, context) {
    if (!this.shouldBeTransformed(node)) { return undefined; }

    if (node.arrayType !== VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of scripts not supported');
    }

    const xml = this.decodeContents(node);
    if (!xml) { throw new Error('Error parsing script'); }

    const document = findChild(xml, 'script');
    if (!document) {
      throw new Error(`Empty document at ${node.nodeId}`);
    }

    // Extract metadata and parameters
    const config = {
      ...this.processMetadata(document),
      parameters: this.processParameters(document),
    };

    // Write config file
    const configFile = this.constructor.splitFile(node, '.json');
    configFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: JSON.stringify(config, null, '  '),
    };
    context.addNode(configFile);

    // Write JavaScript file
    const codeNode = findChild(document, 'code');
    const scriptFile = this.constructor.splitFile(node, '.js');
    scriptFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: textContent(codeNode) || '',
    };
    context.addNode(scriptFile);

    return super.transformFromDB(node);
  }

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

    // eslint-disable-next-line no-param-reassign
    node.value.value = this.encodeContents(result);
  }

}

export class ServerscriptTransformer extends AtviseScriptTransformer {

  static get extension() {
    return '.script';
  }

  shouldBeTransformed(node) {
    return node.isVariable && node.isScript;
  }

}

export class QuickDynamicTransformer extends AtviseScriptTransformer {

  static get extension() {
    return '.qd';
  }

  shouldBeTransformed(node) {
    return node.isVariable && node.isQuickDynamic;
  }

}
