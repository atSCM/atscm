"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DisplayScriptTransformer = exports.QuickDynamicTransformer = exports.ServerscriptTransformer = exports.AtviseScriptTransformer = void 0;

var _gulplog = _interopRequireDefault(require("gulplog"));

var _variant = require("node-opcua/lib/datamodel/variant");

var _modifyXml = require("modify-xml");

var _ConfigTransformer = _interopRequireDefault(require("../lib/transform/ConfigTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * A transformer that splits atvise scripts and quick dynamics into a code file and a .json file
 * containing parameters and metadata.
 */
class AtviseScriptTransformer extends _ConfigTransformer.default {
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
    const config = {};
    const metaTag = (0, _modifyXml.findChild)(document, 'metadata'); // console.error('Meta', metaTag);

    if (!metaTag || !metaTag.childNodes) {
      return config;
    }

    metaTag.childNodes.forEach(child => {
      var _textContent, _textContent2;

      if (child.type !== 'element') {
        return;
      }

      switch (child.name) {
        case 'icon':
          config.icon = Object.assign({
            content: (0, _modifyXml.textContent)(child) || ''
          }, (0, _modifyXml.attributeValues)(child));
          break;

        case 'visible':
          config.visible = Boolean(parseInt((0, _modifyXml.textContent)(child) || '1', 10));
          break;

        case 'title':
          config.title = (_textContent = (0, _modifyXml.textContent)(child)) !== null && _textContent !== void 0 ? _textContent : undefined;
          break;

        case 'description':
          config.description = (_textContent2 = (0, _modifyXml.textContent)(child)) !== null && _textContent2 !== void 0 ? _textContent2 : undefined;
          break;

        default:
          {
            const value = (0, _modifyXml.textContent)(child); // Priority 0 is added to all display scripts by default (atserver 3.5)

            if (child.name === 'priority' && value.trim() === '0') break;

            if (!config.metadata) {
              config.metadata = {};
            }

            if (config.metadata[child.name]) {
              const soFar = config.metadata[child.name];

              if (!Array.isArray(soFar)) {
                config.metadata[child.name] = [soFar];
              }

              config.metadata[child.name].push(value);
            } else {
              config.metadata[child.name] = value;
            }

            if (!['longrunning', 'priority'].includes(child.name)) {
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

    if (!(paramTags === null || paramTags === void 0 ? void 0 : paramTags.length)) {
      return undefined;
    }

    return paramTags.map(node => {
      const {
        childNodes
      } = node;
      const attributes = this.sortedAttributeValues(node);
      const param = Object.assign({}, attributes); // Handle relative parameter targets

      if (attributes.relative === 'true') {
        const target = (0, _modifyXml.findChild)(childNodes.find(_modifyXml.isElement), ['Elements', 'RelativePathElement', 'TargetName']);

        if (target) {
          const [index, name] = ['NamespaceIndex', 'Name'].map(tagName => (0, _modifyXml.textContent)((0, _modifyXml.findChild)(target, tagName)));
          const parsedIndex = parseInt(index, 10);
          param.target = {
            namespaceIndex: isNaN(parsedIndex) ? 1 : parsedIndex,
            name: name || ''
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
    } // If scripts are empty (e.g. created by atvise builder, but never edited) we display a warning and ignore them.


    if (!node.value.value) {
      _gulplog.default.warn(`The script '${node.id.value}' is empty, skipping...`);

      return context.remove(node);
    }

    const xml = this.decodeContents(node);

    if (!xml) {
      throw new Error('Error parsing script');
    }

    const document = (0, _modifyXml.findChild)(xml, 'script');

    if (!document) {
      throw new Error(`Empty document at ${node.id.value}`);
    } // Extract metadata and parameters


    const config = _objectSpread(_objectSpread({}, this.processMetadata(document)), {}, {
      parameters: this.processParameters(document)
    }); // Write config file


    this.writeConfigFile(config, node, context); // Write JavaScript file

    const codeNode = (0, _modifyXml.findChild)(document, 'code');
    const scriptFile = this.constructor.splitFile(node, '.js');
    scriptFile.value = {
      dataType: _variant.DataType.String,
      arrayType: _variant.VariantArrayType.Scalar,
      value: (0, _modifyXml.textContent)(codeNode) || ''
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
    var _config$metadata;

    const configFile = sources['.json'];
    let config = {};

    if (configFile) {
      try {
        config = JSON.parse(configFile.stringValue);
      } catch (e) {
        throw new Error(`Error parsing JSON in ${configFile.relative}: ${e.message}`);
      }
    }

    const scriptFile = sources[this.constructor.scriptSourceExtension];
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

    if ((node.isDisplayScript || node.isScript) && !((_config$metadata = config.metadata) === null || _config$metadata === void 0 ? void 0 : _config$metadata.priority)) {
      meta.push((0, _modifyXml.createElement)('priority', [(0, _modifyXml.createTextNode)('0')]));
    }

    if (node.isQuickDynamic) {
      // - Icon
      if (config.icon) {
        const _config$icon = config.icon,
              {
          content
        } = _config$icon,
              iconConfig = _objectWithoutProperties(_config$icon, ["content"]);

        meta.push((0, _modifyXml.createElement)('icon', [(0, _modifyXml.createTextNode)(content)], iconConfig));
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

        if (attributes.relative === 'true') {
          const {
            namespaceIndex,
            name
          } = attributes.target || {};
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

class DisplayScriptTransformer extends AtviseScriptTransformer {
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

exports.DisplayScriptTransformer = DisplayScriptTransformer;
//# sourceMappingURL=ScriptTransformer.js.map