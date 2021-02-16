/**
 * An atvise-related resource type.
 */
export class AtviseResourceType extends AtviseType {
    /**
     * Creates a new resource type.
     * @param {string} name The type's OPC-UA node id value.
     * @param {string} identifier Atscm's identifier for the new type.
     */
    constructor(name: string, identifier: string);
}
export default AtviseTypes;
/**
 * Special, atvise releated OPC-UA type.
 */
declare class AtviseType {
    /**
     * Creates a new atvise type.
     * @param {string} nodeIdValue The type's OPC-UA node id value.
     * @param {string} identifier Atscm's identifier for the new type.
     * @param {node-opcua~DataType} dataType The type's parent OPC-UA type.
     * @param {string|boolean} [fileExtensionOrKeep] The file extension to use when storing or `true`
     * or `false` indicating if the extension should be kept.
     */
    constructor(nodeIdValue: string, identifier: string, dataType: any, fileExtensionOrKeep?: string | boolean);
    /**
     * Node id of the type's definition
     * @type {node-opcua~NodeId}
     */
    typeDefinition: any;
    /**
     * Atscm's identifier for the type.
     * @type {String}
     */
    identifier: string;
    /**
     * The type's parent OPC-UA type.
     * @type {node-opcua~DataType}
     */
    dataType: any;
    /**
     * The file extension to use when storing.
     * @type {String}
     */
    fileExtension: string;
    /**
     * If the extension should be kept when storing.
     * @type {Boolean}
     */
    keepExtension: boolean;
}
/**
 * The atvise types to handle. **Ordering matters:** The {@link MappingTransformer} takes the first
 * match, therefore **plain types should always come before resource types!**
 * @type {AtviseType[]}
 */
declare const AtviseTypes: AtviseType[];
