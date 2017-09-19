import { DataType } from 'node-opcua';
import NodeId from '../server/NodeId';

class Type {
  constructor(identifier, dataType, fileExtensionOrKeep) {
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

class AtviseType extends Type {
  constructor(nodeIdValue, identifier, dataType, fileExtensionOrKeep) {
    super(identifier, dataType, fileExtensionOrKeep);
    this.typeDefinition = new NodeId(`VariableTypes.ATVISE.${nodeIdValue}`);
  }
}

class CustomResourceType extends Type {
  constructor(name, identifier, dataType, fileExtensionOrKeep) {
    super(identifier, dataType, fileExtensionOrKeep);
    this.typeDefinition = new NodeId(`Custom.${name}`);
  }
}

class AtviseResourceType extends AtviseType {
  constructor(name, identifier) {
    super(`Resource.${name}`, identifier, DataType.ByteString, true);
  }
}

/**
 * The atvise types to handle. **Ordering matters:** The {@link MappingTransformer} takes the first
 * match, therefore **plain types should always come before resource types!**
 * @type {AtviseType[]}
 */
const AtviseTypes = [
  new AtviseType('HtmlHelp', 'help', DataType.ByteString, 'html'),
  new AtviseType('QuickDynamic', 'qd', DataType.XmlElement),
  new AtviseType('ScriptCode', 'script', DataType.XmlElement),
  new AtviseType('Display', 'display', DataType.XmlElement),
  new AtviseType('TranslationTable', 'locs', DataType.XmlElement),
  new AtviseResourceType('Pdf', 'pdf'),
  new AtviseResourceType('Html', 'html'),
  new AtviseResourceType('Javascript', 'js'),
  new AtviseResourceType('Wave', 'wav'),
  new AtviseResourceType('Gif', 'gif'),
  new AtviseResourceType('Png', 'png'),
  new AtviseResourceType('Aac', 'm4a'),
  new AtviseResourceType('Ogg', 'ogg'),
  new AtviseResourceType('Icon', 'ico'),
  new AtviseResourceType('Css', 'css'),
  new AtviseResourceType('Svg', 'svg'),
  new AtviseResourceType('Jpeg', 'jpg'),
  new AtviseResourceType('OctetStream', '*'),
  new CustomResourceType('TypeDefinition', 'typedef', DataType.String, 'json'),
  new CustomResourceType('AtvReferenceConfig', 'references', DataType.String, 'json')
];

export default AtviseTypes;
