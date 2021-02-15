import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import Logger from 'gulplog';
import {
  findChild,
  removeChildren,
  createCDataNode,
  createElement,
  appendChild,
  prependChild,
  textContent,
  createTextNode,
  attributeValues,
  AttributeValues,
} from 'modify-xml';
import { gte } from 'semver';
import XMLTransformer from '../lib/transform/XMLTransformer';
import type { DisplayConfig } from '../../types/schemas/display-config';
import { BrowsedNode } from '../lib/server/NodeBrowser';
import { SplittingTransformer } from '..';

const rootMetaTags = [{ tag: 'title' }, { tag: 'desc', key: 'description' }];

/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
export default class DisplayTransformer extends XMLTransformer {
  /**
   * The extension to add to display container node names when they are pulled.
   * @type {string}
   */
  static get extension() {
    return '.display';
  }

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
    return ['.json', '.svg', this.scriptSourceExtension];
  }

  /**
   * Returns `true` for all display nodes.
   * @param {Node} node The node to check.
   */
  shouldBeTransformed(node) {
    return node.hasTypeDefinition('VariableTypes.ATVISE.Display');
  }

  private normalizeScriptAttributes(
    attributes: AttributeValues
  ): Omit<DisplayConfig['scripts'][0], 'type'> {
    return {
      src: attributes['atv:href'] || attributes['xlink:href'] || attributes.src,
      name: attributes['atv:name'] || undefined,
      mimeType: attributes.type !== 'text/ecmascript' ? attributes.type : undefined,
    };
  }

  /**
   * Splits any read files containing atvise displays into their SVG and JavaScript sources,
   * alongside with a json file containing the display's parameters.
   * @param node The node to split.
   * @param context The transform context.
   */
  async transformFromDB(
    node: BrowsedNode,
    context: { remove: () => void; addNode: (add: BrowsedNode) => void }
  ) {
    if (!this.shouldBeTransformed(node)) {
      return undefined;
    }

    if (node.arrayType !== VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of displays not supported');
    }

    const xml = this.decodeContents(node);
    if (!xml) {
      throw new Error('Error parsing display');
    }

    const document = findChild(xml, 'svg');
    if (!document) {
      throw new Error('Error parsing display: No `svg` tag');
    }

    const config: DisplayConfig = { scripts: [] };
    const scriptTags = removeChildren(document, 'script');
    let inlineScript;

    rootMetaTags.forEach(({ tag, key }) => {
      const [element, ...additional] = removeChildren(document, tag);
      if (!element) return;

      config[key || tag] = textContent(element);

      if (additional.length) {
        Logger.warn(`Removed additional <${tag} /> element inside ${node.nodeId}`);
      }
    });

    // Extract JavaScript
    if (scriptTags.length) {
      scriptTags.forEach((script) => {
        const attributes = attributeValues(script);
        const normalized = this.normalizeScriptAttributes(attributes);

        if (attributes?.['atv:href']) {
          // Linked scripts
          config.scripts.push({
            type: 'linked',
            ...(normalized as { src: string }),
          });
        } else if (attributes?.src || attributes?.['xlink:href']) {
          // Referenced scripts
          config.scripts.push({
            type: 'referenced',
            ...(normalized as { src: string }),
          });
        } else if (inlineScript) {
          // Warn on multiple inline scripts
          Logger[node.id.value.startsWith('SYSTEM.LIBRARY.ATVISE') ? 'debug' : 'warn'](
            `'${node.id.value}' contains multiple inline scripts.`
          );
          document.childNodes.push(inlineScript);
        } else {
          // Inline script
          config.scripts.push({
            type: 'inline',
            ...normalized,
          });
          inlineScript = script;
        }
      });
    }

    if (inlineScript) {
      const scriptFile = (this.constructor as typeof SplittingTransformer).splitFile(node, '.js');
      const scriptText = textContent(inlineScript);

      scriptFile.value = {
        dataType: DataType.String,
        arrayType: VariantArrayType.Scalar,
        value: scriptText,
      };
      context.addNode(scriptFile);
    }

    // Extract metadata
    const metaTag = findChild(document, 'metadata');
    if (metaTag && metaTag.childNodes) {
      // TODO: Warn on multiple metadata tags

      // - Parameters
      const paramTags = removeChildren(metaTag, 'atv:parameter');
      if (paramTags.length) {
        config.parameters = [];

        paramTags.forEach((n) =>
          config.parameters.push(this.sortedAttributeValues(n) as DisplayConfig['parameters'][0])
        );
      }
    }

    // Remove empty config values
    // - Remove inline script config if it's the only script
    //   FIXME: Add option to disable this
    const [firstScript] = config.scripts;
    if (config.scripts.length === 1 && firstScript.type === 'inline') {
      const hasValues = ~Object.values({ ...firstScript, type: undefined }).findIndex((v) => v);

      if (!hasValues) {
        config.scripts.pop();
      }
    }

    // Remove empty scripts array
    if (!config.scripts.length) delete config.scripts;

    // Write files
    const configFile = (this.constructor as typeof SplittingTransformer).splitFile(node, '.json');
    configFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: JSON.stringify(config, null, '  '),
    };
    context.addNode(configFile);

    const svgFile = (this.constructor as typeof SplittingTransformer).splitFile(node, '.svg');
    svgFile.value = {
      dataType: DataType.String,
      arrayType: VariantArrayType.Scalar,
      value: this.encodeContents(xml),
    };
    context.addNode(svgFile);

    // equals: node.renameTo(`${node.name}.display`);
    return super.transformFromDB(node, context);
  }

  scriptTagAttributes(config: Partial<DisplayConfig['scripts'][0]> & { src: string }) {
    return Object.entries(config).reduce(
      (soFar, [key, value]) => {
        let outputKey;

        if (key === 'mimeType') outputKey = 'type';
        if (key === 'src') outputKey = config.type === 'referenced' ? 'xlink:href' : 'atv:href';

        return { ...soFar, [outputKey || `atv:${key}`]: value };
      },
      {
        type: 'text/ecmascript',
      }
    );
  }

  /**
   * Creates a display from the collected nodes.
   * @param {BrowsedNode} node The container node.
   * @param {Map<string, BrowsedNode>} sources The collected files, stored against their
   * extension.
   * @param context The current transform context.
   */
  combineNodes(node, sources, context) {
    const configFile = sources['.json'];
    let config: DisplayConfig = {};

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

    const scriptFile =
      sources[(this.constructor as typeof DisplayTransformer).scriptSourceExtension];
    let inlineScript = '';
    if (scriptFile) {
      inlineScript = scriptFile.stringValue;
    }

    const xml = this.decodeContents(svgFile);
    const result = xml;
    const svg = findChild(result, 'svg');

    if (!svg) {
      throw new Error('Error parsing display SVG: No `svg` tag');
    }

    if (config.dependencies && config.scripts) {
      throw new Error(`Cannot use both 'dependencies' and 'scripts'`);
    }

    const linkedScriptsSupported = gte(context.atserverVersion, '3.5.0');

    const referencedScripts = config.dependencies
      ? config.dependencies.map((src) => ({ src }))
      : config.scripts?.filter((s) => s.type === 'referenced') ?? [];

    const addReferencedScripts = () =>
      referencedScripts.forEach((s) => {
        appendChild(svg, createElement('script', undefined, this.scriptTagAttributes(s)));
      });

    // Insert linked scripts

    if (config.scripts) {
      config.scripts.forEach((s) => {
        if (s.type === 'linked') {
          if (!linkedScriptsSupported) {
            // FIXME: Add possibility to ignore this error (and do what? :) )
            throw new Error(`Linked scripts are only supported on atserver 3.5 and later`);
          }

          appendChild(svg, createElement('script', undefined, this.scriptTagAttributes(s)));
        }
      });
    }

    // Insert dependencies

    // On atserver < 3.5 insert dependencies before the inline script
    if (!linkedScriptsSupported) {
      addReferencedScripts();
    }

    // Insert inline script
    // NOTE: Import order is not preserved on atserver < 3.5
    if (scriptFile) {
      appendChild(
        svg,
        createElement('script', [createCDataNode(inlineScript)], {
          type: 'text/ecmascript',
        })
      );
    }

    // Insert referenced scripts after inline scripts in atserver 3.5+

    if (linkedScriptsSupported) {
      addReferencedScripts();
    }

    // Insert metadata
    // - Parameters
    if (config.parameters && config.parameters.length > 0) {
      let [metaTag] = removeChildren(svg, 'metadata');

      // FIXME: Warn on multiple metadata tags

      if (!metaTag) {
        metaTag = createElement('metadata');
      }

      // Parameters should come before other atv attributes, e.g. `atv:gridconfig`
      for (let i = config.parameters.length - 1; i >= 0; i--) {
        prependChild(
          metaTag,
          createElement('atv:parameter', undefined, config.parameters[i] as AttributeValues)
        );
      }

      // Insert <metadata> as first element in the resulting svg, after <defs>, <desc> and
      // <title> if defined (nothing to do, they are ordered inside #encodeContents)
      prependChild(svg, metaTag);
    }

    // - Title and description
    rootMetaTags.reverse().forEach(({ tag, key }) => {
      const value = config[key || tag] as string;

      if (value !== undefined) {
        prependChild(svg, createElement(tag, [createTextNode(value)]));
      }
    });

    // eslint-disable-next-line
    node.value.value = this.encodeContents(result);
    return node;
  }
}
