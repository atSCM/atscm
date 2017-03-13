'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _NodeId = require('../server/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class AtviseType {

  constructor(nodeIdValue, identifier, dataType, fileExtensionOrKeep) {
    this.typeDefinition = new _NodeId2.default(`VariableTypes.ATVISE.${nodeIdValue}`);
    this.identifier = identifier;
    this.dataType = dataType;
    if (fileExtensionOrKeep !== undefined) {
      if (typeof fileExtensionOrKeep === 'string') {
        this.fileExtension = fileExtensionOrKeep;
      } else {
        this.keepExtension = fileExtensionOrKeep;
      }
    }
  }

}

class AtviseResourceType extends AtviseType {

  constructor(name, identifier) {
    super(`Resource.${name}`, identifier, _nodeOpcua.DataType.ByteString, true);
  }

}

/**
 * The atvise types to handle. **Ordering matters:** The {@link MappingTransformer} takes the first
 * match, therefore **plain types should always come before resource types!**
 * @type {AtviseType[]}
 */
const AtviseTypes = [new AtviseType('HtmlHelp', 'help', _nodeOpcua.DataType.XmlElement, 'html'), new AtviseType('QuickDynamic', 'qd', _nodeOpcua.DataType.XmlElement), new AtviseType('ScriptCode', 'script', _nodeOpcua.DataType.XmlElement), new AtviseType('Display', 'display', _nodeOpcua.DataType.XmlElement), new AtviseType('TranslationTable', 'locs', _nodeOpcua.DataType.XmlElement), new AtviseResourceType('Pdf', 'pdf'), new AtviseResourceType('Html', 'html'), new AtviseResourceType('Javascript', 'js'), new AtviseResourceType('Wave', 'wav'), new AtviseResourceType('Gif', 'gif'), new AtviseResourceType('Png', 'png'), new AtviseResourceType('Aac', 'm4a'), new AtviseResourceType('Ogg', 'ogg'), new AtviseResourceType('Icon', 'ico'), new AtviseResourceType('Css', 'css'), new AtviseResourceType('Svg', 'svg'), new AtviseResourceType('Jpeg', 'jpg'), new AtviseResourceType('OctetStream', '*')];

exports.default = AtviseTypes;