"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QuickDynamicTransformer = exports.ServerscriptTransformer = exports.AtviseScriptTransformer = void 0;

var _gulplog = _interopRequireDefault(require("gulplog"));

var _variant = require("node-opcua/lib/datamodel/variant");

var _modifyXml = require("modify-xml");

var _XMLTransformer = _interopRequireDefault(require("../lib/transform/XMLTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

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
    const metaTag = (0, _modifyXml.findChild)(document, 'metadata'); // console.error('Meta', metaTag);

    if (!metaTag || !metaTag.childNodes) {
      return config;
    }

    metaTag.childNodes.forEach(child => {
      if (child.type !== 'element') {
        return;
      }

      switch (child.name) {
        case 'icon':
          config.icon = Object.assign({
            content: (0, _modifyXml.textContent)(child) || ''
          }, child.attributes);
          break;

        case 'visible':
          config.visible = Boolean(parseInt((0, _modifyXml.textContent)(child), 10));
          break;

        case 'title':
          config.title = (0, _modifyXml.textContent)(child);
          break;

        case 'description':
          config.description = (0, _modifyXml.textContent)(child);
          break;

        default:
          {
            if (!config.metadata) {
              config.metadata = {};
            }

            const value = (0, _modifyXml.textContent)(child);

            if (config.metadata[child.name]) {
              if (!Array.isArray(config.metadata[child.name])) {
                config.metadata[child.name] = [config.metadata[child.name]];
              }

              config.metadata[child.name].push(value);
            } else {
              config.metadata[child.name] = (0, _modifyXml.textContent)(child);
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
    const paramTags = (0, _modifyXml.findChildren)(document, 'parameter');

    if (!paramTags.length) {
      return undefined;
    }

    return paramTags.map(({
      attributes,
      childNodes
    }) => {
      const param = Object.assign({}, attributes); // Handle relative parameter targets

      if (attributes.relative === 'true') {
        param.target = {};
        const target = (0, _modifyXml.findChild)(childNodes.find(_modifyXml.isElement), ['Elements', 'RelativePathElement', 'TargetName']);

        if (target) {
          const [index, name] = ['NamespaceIndex', 'Name'].map(tagName => (0, _modifyXml.textContent)((0, _modifyXml.findChild)(target, tagName)));
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

    const document = (0, _modifyXml.findChild)(xml, 'script');

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

    const codeNode = (0, _modifyXml.findChild)(document, 'code');
    const scriptFile = this.constructor.splitFile(node, '.js');
    scriptFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: (0, _modifyXml.textContent)(codeNode) || ''
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

    const document = (0, _modifyXml.createElement)('script', []);
    const result = {
      childNodes: [{
        type: 'directive',
        value: '<?xml version="1.0" encoding="UTF-8"?>'
      }, document]
    }; // Insert metadata

    const meta = [];

    if (node.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const icon = config.icon.content;
        delete config.icon.content;
        meta.push((0, _modifyXml.createElement)('icon', [(0, _modifyXml.createTextNode)(icon)], config.icon));
      } // - Other fields


      if (config.visible !== undefined) {
        meta.push((0, _modifyXml.createElement)('visible', [(0, _modifyXml.createTextNode)(`${config.visible ? 1 : 0}`)]));
      }

      if (config.title !== undefined) {
        meta.push((0, _modifyXml.createElement)('title', [(0, _modifyXml.createTextNode)(config.title)]));
      }

      if (config.description !== undefined) {
        meta.push((0, _modifyXml.createElement)('description', [(0, _modifyXml.createTextNode)(config.description)]));
      }
    } // - Additional fields


    if (config.metadata !== undefined) {
      Object.entries(config.metadata).forEach(([name, value]) => {
        (Array.isArray(value) ? value : [value]).forEach(v => meta.push((0, _modifyXml.createElement)(name, [(0, _modifyXml.createTextNode)(v)])));
      });
    }

    if (node.isQuickDynamic || meta.length) {
      (0, _modifyXml.prependChild)(document, (0, _modifyXml.createElement)('metadata', meta));
    } // Insert parameters


    if (config.parameters) {
      config.parameters.forEach(attributes => {
        let elements; // Handle relative parameter targets

        if (attributes.relative === 'true' && attributes.target) {
          const {
            namespaceIndex,
            name
          } = attributes.target;
          const targetElements = (0, _modifyXml.createElement)('Elements');
          elements = [(0, _modifyXml.createElement)('RelativePath', [targetElements])];

          if (name !== undefined) {
            targetElements.childNodes = [(0, _modifyXml.createElement)('RelativePathElement', [(0, _modifyXml.createElement)('TargetName', [(0, _modifyXml.createElement)('NamespaceIndex', [(0, _modifyXml.createTextNode)(`${namespaceIndex}`)]), (0, _modifyXml.createElement)('Name', [(0, _modifyXml.createTextNode)(`${name}`)])])])];
          } // eslint-disable-next-line no-param-reassign


          delete attributes.target;
        }

        (0, _modifyXml.appendChild)(document, (0, _modifyXml.createElement)('parameter', elements, attributes));
      });
    } // Insert script code


    (0, _modifyXml.appendChild)(document, (0, _modifyXml.createElement)('code', [(0, _modifyXml.createCDataNode)(code)])); // eslint-disable-next-line no-param-reassign

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