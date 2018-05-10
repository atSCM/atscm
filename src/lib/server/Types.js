import { DataType } from 'node-opcua';
import NodeId from '../model/opcua/NodeId';

/**
 * Special, atvise releated OPC-UA type.
 */
class AtviseType {

  /**
   * Creates a new atvise type.
   * @param {string} nodeIdValue The type's OPC-UA node id value.
   * @param {string} identifier Atscm's identifier for the new type.
   * @param {node-opcua~DataType} dataType The type's parent OPC-UA type.
   * @param {String|Boolean} [fileExtensionOrKeep] The file extension to use when storing or `true`
   * or `false` indicating if the extension should be kept.
   */
  constructor(nodeIdValue, identifier, dataType, fileExtensionOrKeep) {
    /**
     * Node id of the type's definition
     * @type {node-opcua~NodeId}
     */
    this.typeDefinition = new NodeId(`VariableTypes.ATVISE.${nodeIdValue}`);

    /**
     * Atscm's identifier for the type.
     * @type {String}
     */
    this.identifier = identifier;
    /**
     * The type's parent OPC-UA type.
     * @type {node-opcua~DataType}
     */
    this.dataType = dataType;
    if (fileExtensionOrKeep !== undefined) {
      if (typeof fileExtensionOrKeep === 'string') {
        /**
         * The file extension to use when storing.
         * @type {String}
         */
        this.fileExtension = fileExtensionOrKeep;
      } else {
        /**
         * If the extension should be kept when storing.
         * @type {Boolean}
         */
        this.keepExtension = fileExtensionOrKeep;
      }
    }
  }

}

/**
 * An atvise-related resource type.
 */
class AtviseResourceType extends AtviseType {

  /**
   * Creates a new resource type.
   * @param {string} name The type's OPC-UA node id value.
   * @param {string} identifier Atscm's identifier for the new type.
   */
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
  new AtviseResourceType('Html', 'htm'),
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
];

export default AtviseTypes;
