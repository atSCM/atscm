"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QuickDynamicTransformer = exports.ServerscriptTransformer = exports.AtviseScriptTransformer = void 0;

var _gulplog = _interopRequireDefault(require("gulplog"));

var _variant = require("node-opcua/lib/datamodel/variant");

var _XMLTransformer = _interopRequireDefault(require("../lib/transform/XMLTransformer"));

var _xml = require("../lib/helpers/xml");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
class AtviseScriptTransformer extends _XMLTransformer.default {
  /**
   * The source file extensions to allow.
   * @type {string[]}
   */
  static get sourceExtensions() {
    return ['.json', '.js'];
  }
  /**
   * Extracts a script's metadata.
   * @param {Object} document The parsed xml document to process.
   * @return {Object} The metadata found.
   */


  processMetadata(document) {
    const config = {};
    const metaTag = (0, _xml.findChild)(document, 'metadata');

    if (!metaTag || !metaTag.elements) {
      return config;
    }

    metaTag.elements.forEach(child => {
      if (child.type !== 'element') {
        return;
      }

      switch (child.name) {
        case 'icon':
          config.icon = Object.assign({
            content: (0, _xml.textContent)(child) || ''
          }, child.attributes);
          break;

        case 'visible':
          config.visible = Boolean(parseInt((0, _xml.textContent)(child), 10));
          break;

        case 'title':
          config.title = (0, _xml.textContent)(child);
          break;

        case 'description':
          config.description = (0, _xml.textContent)(child);
          break;

        default:
          {
            if (!config.metadata) {
              config.metadata = {};
            }

            const value = (0, _xml.textContent)(child);

            if (config.metadata[child.name]) {
              if (!Array.isArray(config.metadata[child.name])) {
                config.metadata[child.name] = [config.metadata[child.name]];
              }

              config.metadata[child.name].push(value);
            } else {
              config.metadata[child.name] = (0, _xml.textContent)(child);
            }

            if (!['longrunning'].includes(child.name)) {
              _gulplog.default.debug(`Generic metadata element '${child.name}'`); // FIXME:  at ${node.nodeId}

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
    const paramTags = (0, _xml.findChildren)(document, 'parameter');

    if (!paramTags.length) {
      return undefined;
    }

    return paramTags.map(({
      attributes,
      elements
    }) => {
      const param = Object.assign({}, attributes); // Handle relative parameter targets

      if (attributes.relative === 'true') {
        param.target = {};
        const target = (0, _xml.findChild)(elements[0], ['Elements', 'RelativePathElement', 'TargetName']);

        if (target) {
          const [index, name] = ['NamespaceIndex', 'Name'].map(tagName => (0, _xml.textContent)((0, _xml.findChild)(target, tagName)));
          const parsedIndex = parseInt(index, 10);
          param.target = {
            namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex,
            name
          };
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

    if (node.arrayType !== _variant.VariantArrayType.Scalar) {
      // FIXME: Instead of throwing we could simply pass the original node to the callback
      throw new Error('Array of scripts not supported');
    }

    const xml = this.decodeContents(node);

    if (!xml) {
      throw new Error('Error parsing script');
    }

    const document = (0, _xml.findChild)(xml, 'script');

    if (!document) {
      throw new Error(`Empty document at ${node.nodeId}`);
    } // Extract metadata and parameters


    const config = _objectSpread({}, this.processMetadata(document), {
      parameters: this.processParameters(document)
    }); // Write config file


    const configFile = this.constructor.splitFile(node, '.json');
    configFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: JSON.stringify(config, null, '  ')
    };
    context.addNode(configFile); // Write JavaScript file

    const codeNode = (0, _xml.findChild)(document, 'code');
    const scriptFile = this.constructor.splitFile(node, '.js');
    scriptFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: (0, _xml.textContent)(codeNode) || ''
    };
    context.addNode(scriptFile);
    return super.transformFromDB(node);
  }
  /**
   * Inlines the passed source nodes to the given container node.
   * @param {Node} node The container node.
   * @param {{ [ext: string]: Node }} sources The source nodes to inline.
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

    const scriptFile = sources['.js'];
    let code = '';

    if (scriptFile) {
      code = scriptFile.stringValue;
    }

    const document = (0, _xml.createElement)('script', []);
    const result = {
      elements: [document]
    }; // Insert metadata

    const meta = [];

    if (node.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;
        meta.push((0, _xml.createElement)('icon', [(0, _xml.createTextNode)(icon)], config.icon));
      } // - Other fields


      if (config.visible !== undefined) {
        meta.push((0, _xml.createElement)('visible', [(0, _xml.createTextNode)(`${config.visible ? 1 : 0}`)]));
      }

      if (config.title !== undefined) {
        meta.push((0, _xml.createElement)('title', [(0, _xml.createTextNode)(config.title)]));
      }

      if (config.description !== undefined) {
        meta.push((0, _xml.createElement)('description', [(0, _xml.createTextNode)(config.description)]));
      }
    } // - Additional fields


    if (config.metadata !== undefined) {
      Object.entries(config.metadata).forEach(([name, value]) => {
        (Array.isArray(value) ? value : [value]).forEach(v => meta.push((0, _xml.createElement)(name, [(0, _xml.createTextNode)(v)])));
      });
    }

    if (node.isQuickDynamic || meta.length) {
      document.elements.push((0, _xml.createElement)('metadata', meta));
    } // Insert parameters


    if (config.parameters) {
      config.parameters.forEach(attributes => {
        let elements; // Handle relative parameter targets

        if (attributes.relative === 'true' && attributes.target) {
          const {
            namespaceIndex,
            name
          } = attributes.target;
          const targetElements = (0, _xml.createElement)('Elements');
          elements = [(0, _xml.createElement)('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.elements = [(0, _xml.createElement)('RelativePathElement', [(0, _xml.createElement)('TargetName', [(0, _xml.createElement)('NamespaceIndex', [(0, _xml.createTextNode)(`${namespaceIndex}`)]), (0, _xml.createElement)('Name', [(0, _xml.createTextNode)(`${name}`)])])])];
          } // eslint-disable-next-line no-param-reassign


          delete attributes.target;
        }

        document.elements.push((0, _xml.createElement)('parameter', elements, attributes));
      });
    } // Insert script code


    document.elements.push((0, _xml.createElement)('code', [(0, _xml.createCDataNode)(code)])); // eslint-disable-next-line no-param-reassign

    node.value.value = this.encodeContents(result);
  }

}
/**
 * A transformer that splits atvise server scripts into multiple files.
 */


exports.AtviseScriptTransformer = AtviseScriptTransformer;

class ServerscriptTransformer extends AtviseScriptTransformer {
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


exports.ServerscriptTransformer = ServerscriptTransformer;

class QuickDynamicTransformer extends AtviseScriptTransformer {
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

exports.QuickDynamicTransformer = QuickDynamicTransformer;
//# sourceMappingURL=ScriptTransformer.js.map