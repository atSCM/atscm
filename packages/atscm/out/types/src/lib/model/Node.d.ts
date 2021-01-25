import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { VariantArrayType, DataType, Variant } from 'node-opcua/lib/datamodel/variant';
import { ItemOf, KeyOf } from 'node-opcua/lib/misc/enum.js';
import { ValueOf } from '../helpers/types';
/**
 * References type ids.
 */
export declare const ReferenceTypeIds: {
    toParent: number;
    References: 31;
    NonHierarchicalReferences: 32;
    HierarchicalReferences: 33;
    HasChild: 34;
    Organizes: 35;
    /**
     * If the node is a serverside script.
     */
    HasEventSource: 36;
    HasModellingRule: 37;
    HasEncoding: 38;
    HasDescription: 39;
    HasTypeDefinition: 40;
    GeneratesEvent: 41;
    Aggregates: 44; /**
     * If the node is a quickdynamic.
     */
    HasSubtype: 45;
    HasProperty: 46;
    HasComponent: 47;
    HasNotifier: 48;
    HasOrderedComponent: 49;
    FromState: 51;
    ToState: 52;
    HasCause: 53; /**
     * A node during a *pull*.
     */
    HasEffect: 54;
    HasHistoricalConfiguration: 56;
    HasSubStateMachine: 117; /**
     * The node's name.
     */
    HasArgumentDescription: 129;
    HasOptionalInputArgumentDescription: 131;
    AlwaysGeneratesEvent: 3065;
    HasTrueSubState: 9004;
    HasFalseSubState: 9005;
    HasCondition: 9006;
    HasPubSubConnection: 14476;
    DataSetToWriter: 14936;
    HasGuard: 15112;
    HasDataSetWriter: 15296;
    HasDataSetReader: 15297;
    HasAlarmSuppressionGroup: 16361;
    AlarmGroupMember: 16362;
    HasEffectDisable: 17276;
    HasDictionaryEntry: 17597;
    HasInterface: 17603;
    HasAddIn: 17604;
    HasEffectEnable: 17983;
    HasEffectSuppressed: 17984;
    HasEffectUnsuppressed: 17985;
};
/** A reference type name */
declare type ReferenceTypeName = keyof typeof ReferenceTypeIds;
/** A raw (number) reference type */
declare type ReferenceType = ValueOf<typeof ReferenceTypeIds>;
/** Node references stored in definition files */
export declare type ReferenceDefinitions = {
    [type in ReferenceTypeName]?: (number | string)[];
};
/** Node definition stored in definition file */
export interface NodeDefinition {
    nodeId?: string;
    nodeClass?: KeyOf<typeof NodeClass>;
    dataType?: KeyOf<typeof DataType>;
    arrayType?: KeyOf<typeof VariantArrayType>;
    references?: ReferenceDefinitions;
}
/**
 * Names for references.
 */
export declare const ReferenceTypeNames: {
    [key: number]: string;
};
/**
 * A map specialized for holding references.
 */
declare class ReferenceMap extends Map<ReferenceType, Set<number | string>> {
    /**
     * Adds a new reference.
     * @param {number} type The reference id.
     * @param {string} nodeId The reference target node's id.
     */
    addReference(type: ReferenceType, nodeId: number | string): void;
    /**
     * Removes the given reference.
     * @param {number} type The reference id.
     * @param {string} nodeId The reference target node's id.
     */
    deleteReference(type: ReferenceType, nodeId: number | string): number | string;
    /**
     * Returns the first entry of a specific type.
     * @param type The reference type id to look for.
     * @return The first reference found or undefined.
     */
    getSingle(type: ReferenceType): number | string | undefined;
    /**
     * Returns a plain object of refernces.
     * @return A string describing the reference map.
     */
    toJSON(): ReferenceDefinitions;
}
interface WithValue {
    value: Variant;
}
export interface NodeOptions {
    name: string;
    parent?: Node;
    nodeClass: ItemOf<typeof NodeClass>;
}
declare type NodeResolveKey = 'nodeClass' | 'dataType' | 'arrayType';
/**
 * The main model class.
 */
export default abstract class Node {
    /** The node's name when stored to a file. */
    protected fileName: string;
    /** The node's name when written to the server. */
    protected idName: string;
    /** The id stored in the definition file. */
    protected specialId?: string;
    /** The node's parent node. */
    readonly parent?: Node;
    /** The node's class. */
    readonly nodeClass: ItemOf<typeof NodeClass>;
    /** A set of resolved properties. */
    protected _resolved: Set<NodeResolveKey>;
    /** A set of unresolved properties. */
    protected _unresolved: Set<NodeResolveKey>;
    /** The node's references. */
    references: ReferenceMap;
    /** The node's unresolved refernces. */
    protected _resolvedReferences: ReferenceMap;
    /** The node's resolved refernces. */
    protected _unresolvedReferences: ReferenceMap;
    /** If the parent node resolves metadata. */
    protected _parentResolvesMetadata: boolean;
    /**
     * Creates a new node.
     * @param {Object} options The options to use.
     * @param {string} options.name The node's name.
     * @param {Node} options.parent The node's parent node.
     * @param {node-opcua~NodeClass} options.nodeClass The node's class.
     */
    constructor({ name, parent, nodeClass }: NodeOptions);
    /**
     * If the parent resolves metadata (for example: split transformer source files).
     */
    get parentResolvesMetadata(): boolean;
    markAsResolved(key: NodeResolveKey): void;
    isResolved(key: NodeResolveKey): boolean;
    /**
     * Adds a new reference.
     * @param {number} type The reference type's id.
     * @param {string} id The reference target node's id.
     */
    addReference(type: ReferenceType, id: string): void;
    setReferences(type: ReferenceType, ids: string[]): void;
    markReferenceAsResolved(name: ReferenceTypeName, value: string): void;
    markAllReferencesAsResolved(name: ReferenceTypeName): void;
    hasUnresolvedReference(name: ReferenceTypeName): boolean;
    /**
     * The node's file path, used to compute {@link Node#filePath}.
     */
    private get _filePath();
    /**
     * The node's file path.
     */
    get filePath(): string[];
    /**
     * The node's id, used to compute {@link Node#nodeId}.
     */
    private get _nodeId();
    /**
     * The node's id.
     */
    get nodeId(): string;
    /**
     * The node's type definition if given.
     */
    get typeDefinition(): number | string | undefined;
    /**
     * The node's modellingRule if given.
     * @type {?number}
     */
    get modellingRule(): number | string | undefined;
    /**
     * Returns `true` if the node has the given type definition.
     * @param typeDefName - The type definition to check.
     * @return If the node has the given type definition.
     */
    hasTypeDefinition(typeDefName: number | string): boolean;
    /**
     * `true` at the moment.
     */
    get hasUnresolvedMetadata(): boolean;
    /**
     * The metadata to store in the node's definition file.
     * @type {Object}
     */
    get metadata(): NodeDefinition;
    /**
     * Creates a new child node.
     * @param {Object} options The options to use.
     * @param {string} options.extension The extension to append to the node's name.
     */
    createChild({ extension }: {
        extension: string;
    }): Node;
    /**
     * The node's data type.
     */
    get dataType(): ItemOf<typeof DataType>;
    /**
     * The node's array type.
     */
    get arrayType(): ItemOf<typeof VariantArrayType>;
    /**
     * If the node is a variable.
     * @deprecated Use TypeScript compatible {@link Node#isVariableNode} instead.
     */
    get isVariable(): boolean;
    isVariableNode(): this is WithValue;
    /**
     * If the node is an object display.
     */
    get isDisplay(): boolean;
    /**
     * If the node is a serverside script.
     */
    get isScript(): boolean;
    /**
     * If the node is a quickdynamic.
     */
    get isQuickDynamic(): boolean;
}
/**
 * A node during a *pull*.
 */
export declare abstract class ServerNode extends Node {
    /**
     * The node's name.
     */
    get name(): string;
    /**
     * Renames a node.
     * @param name The name to set.
     */
    renameTo(name: string): void;
}
/**
 * A node during a *push*.
 */
export declare abstract class SourceNode extends Node {
    /**
     * The node's name.
     */
    get name(): string;
    /**
     * Renames a node.
     * @param name The name to set.
     */
    renameTo(name: string): void;
}
export {};
