import { ReferenceTypeIds as OpcReferenceTypeIds } from 'node-opcua/lib/opcua_node_ids';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { VariantArrayType, DataType, Variant } from 'node-opcua/lib/datamodel/variant';
import { ItemOf, KeyOf } from 'node-opcua/lib/misc/enum.js';
import { reverse } from '../helpers/Object';
import { sortReferences } from '../helpers/mapping';
import { ValueOf } from '../helpers/types';

/**
 * References type ids.
 */
export const ReferenceTypeIds = {
  ...OpcReferenceTypeIds,
  toParent: -1,
};

/** A reference type name */
type ReferenceTypeName = keyof typeof ReferenceTypeIds;

/** A raw (number) reference type */
type ReferenceType = ValueOf<typeof ReferenceTypeIds>;

/** Node references stored in definition files */
export type ReferenceDefinitions = {
  [type in ReferenceTypeName]?: (number | string)[];
};

/** Node definition stored in definition file */
export interface NodeDefinition {
  nodeId?: string;
  nodeClass?: KeyOf<typeof NodeClass>; // Defaults to 'Variable'
  dataType?: KeyOf<typeof DataType>;
  arrayType?: KeyOf<typeof VariantArrayType>;
  references?: ReferenceDefinitions;
}

/**
 * Names for references.
 */
export const ReferenceTypeNames = reverse(ReferenceTypeIds);

/**
 * A map specialized for holding references.
 */
class ReferenceMap extends Map<ReferenceType, Set<number | string>> {

  /**
   * Adds a new reference.
   * @param {number} type The reference id.
   * @param {string} nodeId The reference target node's id.
   */
  public addReference(type: ReferenceType, nodeId: number | string): void {
    const set = this.get(type);
    if (set) {
      set.add(nodeId);
    } else {
      this.set(type, new Set([nodeId]));
    }
  }

  /**
   * Removes the given reference.
   * @param {number} type The reference id.
   * @param {string} nodeId The reference target node's id.
   */
  public deleteReference(type: ReferenceType, nodeId: number | string): number | string {
    const set = this.get(type);
    if (set) {
      const ref = set.delete(nodeId);

      if (ref) {
        if (set.size === 0) {
          this.delete(type);
        }

        return nodeId;
      }
    }

    throw new Error(`No ${ReferenceTypeNames[type] || type} reference to ${nodeId}`);
  }

  /**
   * Returns the first entry of a specific type.
   * @param type The reference type id to look for.
   * @return The first reference found or undefined.
   */
  public getSingle(type: ReferenceType): number | string | undefined {
    const set = this.get(type);
    return set && Array.from(set)[0];
  }

  /**
   * Returns a plain object of refernces.
   * @return A string describing the reference map.
   */
  public toJSON(): ReferenceDefinitions {
    return [...this]
      .reduce((result, [key, value]) => Object.assign(result, {
        [ReferenceTypeNames[key] || key]: [...value],
      }), {});
  }

}

interface WithValue {
  value: Variant;
}

export interface NodeOptions {
  name: string;
  parent?: Node;
  nodeClass: ItemOf<typeof NodeClass>;
}

type NodeResolveKey = 'nodeClass' | 'dataType' | 'arrayType';

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
  public readonly parent?: Node;
  /** The node's class. */
  public readonly nodeClass: ItemOf<typeof NodeClass>;

  /** A set of resolved properties. */
  protected _resolved = new Set<NodeResolveKey>();
  /** A set of unresolved properties. */
  protected _unresolved: Set<NodeResolveKey>;
  /** The node's references. */
  public references = new ReferenceMap();
  /** The node's unresolved refernces. */
  protected _resolvedReferences = new ReferenceMap();
  /** The node's resolved refernces. */
  protected _unresolvedReferences = new ReferenceMap();
  /** If the parent node resolves metadata. */
  protected _parentResolvesMetadata: boolean = false;

  /**
   * Creates a new node.
   * @param {Object} options The options to use.
   * @param {string} options.name The node's name.
   * @param {Node} options.parent The node's parent node.
   * @param {node-opcua~NodeClass} options.nodeClass The node's class.
   */
  public constructor({ name, parent, nodeClass/* , referenceToParent */ }: NodeOptions) {
    this.fileName = name;
    this.idName = name;
    this.parent = parent;
    this.nodeClass = nodeClass;

    this._unresolved = new Set([
      'nodeClass',
      // Only for variables
      'dataType',
      'arrayType',
    ]);
  }

  /**
   * If the parent resolves metadata (for example: split transformer source files).
   */
  public get parentResolvesMetadata(): boolean {
    return this._parentResolvesMetadata;
  }

  public markAsResolved(key: NodeResolveKey): void {
    const value = this._unresolved.delete(key);

    // FIXME: Only test if debug / test
    if (value === false) {
      throw new Error(`'${key}' is already resolved`);
    }

    this._resolved.add(key);
  }

  public isResolved(key: NodeResolveKey): boolean {
    return this._resolved.has(key);
  }

  /**
   * Adds a new reference.
   * @param {number} type The reference type's id.
   * @param {string} id The reference target node's id.
   */
  public addReference(type: ReferenceType, id: string): void {
    this.references.addReference(type, id);
    this._unresolvedReferences.addReference(type, id);
  }

  public setReferences(type: ReferenceType, ids: string[]): void {
    this.references.set(type, new Set(ids));
    this._unresolvedReferences.set(type, new Set(ids));
  }

  public markReferenceAsResolved(name: ReferenceTypeName, value: string): void {
    const type = ReferenceTypeIds[name];
    const ref = this._unresolvedReferences.deleteReference(type, value);
    this._resolvedReferences.addReference(type, ref);
  }

  public markAllReferencesAsResolved(name: ReferenceTypeName): void {
    const type = ReferenceTypeIds[name];
    this._unresolvedReferences.delete(type);
  }

  public hasUnresolvedReference(name: ReferenceTypeName): boolean {
    const type = ReferenceTypeIds[name];
    return this._unresolvedReferences.has(type);
  }

  /**
   * The node's file path, used to compute {@link Node#filePath}.
   */
  private get _filePath(): string[] {
    if (!this.parent) { return [this.fileName]; }
    return this.parent._filePath.concat(this.fileName);
  }

  /**
   * The node's file path.
   */
  public get filePath(): string[] {
    if (!this.parent) { return []; }
    return this.parent._filePath;
  }

  /**
   * The node's id, used to compute {@link Node#nodeId}.
   */
  private get _nodeId(): { id: string; separator: '/' | '.' } {
    if (this.specialId) {
      return {
        id: this.specialId,
        separator: this.specialId.match(/\.RESOURCES\/?/) ? '/' : '.',
      };
    }

    if (!this.parent) {
      return {
        id: this.idName,
        separator: '.',
      };
    }

    const { separator, id } = this.parent._nodeId;

    if (this._parentResolvesMetadata) {
      return { separator, id };
    }

    return {
      separator: this.idName === 'RESOURCES' ? '/' : separator,
      id: `${id}${separator}${this.idName}`,
    };
  }

  /**
   * The node's id.
   */
  public get nodeId(): string {
    return this._nodeId.id;
  }

  /**
   * The node's type definition if given.
   */
  public get typeDefinition(): number | string | undefined {
    return this.references.getSingle(ReferenceTypeIds.HasTypeDefinition);
  }

  /**
   * The node's modellingRule if given.
   * @type {?number}
   */
  public get modellingRule(): number | string | undefined {
    return this.references.getSingle(ReferenceTypeIds.HasModellingRule);
  }

  /**
   * Returns `true` if the node has the given type definition.
   * @param typeDefName - The type definition to check.
   * @return If the node has the given type definition.
   */
  public hasTypeDefinition(typeDefName: number | string): boolean {
    const def = this.typeDefinition;

    return def ? def === typeDefName : false;
  }

  /**
   * `true` at the moment.
   */
  public get hasUnresolvedMetadata(): boolean {
    return true;
    /* FIXME: Once plugin mapping is implemented
    const value = !this._parentResolvesMetadata && (Boolean(this._unresolved.size) ||
      Boolean(this._unresolvedReferences.size) || this.specialId);

    // FIXME: If debug / test
    if (!value && Object.keys(this.metadata).length > 0) {
      throw new Error(`#hasUnresolvedMetadata did return invalid result ${
        value
      } for ${
        JSON.stringify(Object.assign(this, {parent: undefined, value: undefined }), null, '  ')
      }`);
    } else if (value && Object.keys(this.metadata).length === 0) {
      throw new Error('#metadata did return invalid result');
    }

    return value; */
  }

  /**
   * The metadata to store in the node's definition file.
   * @type {Object}
   */
  public get metadata(): NodeDefinition {
    if (this._parentResolvesMetadata) { return {}; }

    const meta: Partial<NodeDefinition> = {};

    if (this.specialId) {
      meta.nodeId = this.specialId;
    }

    if (this.isVariableNode()) {
      meta.dataType = this.value.dataType.key;
      meta.arrayType = this.value.arrayType.key;
    } else {
      meta.nodeClass = this.nodeClass.key;
    }

    meta.references = sortReferences(this.references.toJSON());

    /* FIXME: Once plugin mapping is implemented
    for (const unresolved of this._unresolved) {
      let value = this[unresolved];

      if (unresolved === 'dataType') {
        value = this.value.dataType ? this.value.dataType.key : 'UNKNOWN';
      } else if (unresolved === 'arrayType') {
        value = this.value.arrayType ? this.value.arrayType.key : 'UNKNOWN';
      }

      meta[unresolved] = value;
    }


    if (this._unresolvedReferences.size) {
      meta.references = sortReferences(this._unresolvedReferences.toJSON());
    }
    */

    return meta;
  }

  // Manipulation

  /**
   * Creates a new child node.
   * @param {Object} options The options to use.
   * @param {string} options.extension The extension to append to the node's name.
   */
  public createChild({ extension }: { extension: string }): Node {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node: Node = new (this.constructor as any)({
      name: this.idName,
      parent: this,
      nodeClass: this.nodeClass,
    });

    node.fileName = `${this.fileName}${extension}`;

    node.references = this.references;
    node._parentResolvesMetadata = true;

    return node;
  }

  // Convenience getters

  /**
   * The node's data type.
   */
  public get dataType(): ItemOf<typeof DataType> {
    if (!this.isVariableNode()) { throw new TypeError('Not a variable node'); }

    return this.value.dataType;
  }

  /**
   * The node's array type.
   */
  public get arrayType(): ItemOf<typeof VariantArrayType> {
    if (!this.isVariableNode()) { throw new TypeError('Not a variable node'); }

    return this.value.arrayType;
  }

  /**
   * If the node is a variable.
   * @deprecated Use TypeScript compatible {@link Node#isVariableNode} instead.
   */
  public get isVariable(): boolean {
    return this.nodeClass === NodeClass.Variable;
  }

  public isVariableNode(): this is WithValue {
    return this.isVariable;
  }

  // FIXME: Move to display / script transformers

  /**
   * If the node is an object display.
   */
  public get isDisplay(): boolean {
    return this.hasTypeDefinition('VariableTypes.ATVISE.Display');
  }

  /**
   * If the node is a serverside script.
   */
  public get isScript(): boolean {
    return this.hasTypeDefinition('VariableTypes.ATVISE.ScriptCode');
  }

  /**
   * If the node is a quickdynamic.
   */
  public get isQuickDynamic(): boolean {
    return this.hasTypeDefinition('VariableTypes.ATVISE.QuickDynamic');
  }

}

/**
 * A node during a *pull*.
 */
export abstract class ServerNode extends Node {

  /**
   * The node's name.
   */
  public get name(): string {
    return this.fileName;
  }

  /**
   * Renames a node.
   * @param name The name to set.
   */
  public renameTo(name: string): void {
    this.fileName = name;
  }

}

/**
 * A node during a *push*.
 */
export abstract class SourceNode extends Node {

  /**
   * The node's name.
   */
  public get name(): string {
    return this.idName;
  }

  /**
   * Renames a node.
   * @param name The name to set.
   */
  public renameTo(name: string): void {
    this.idName = name;
  }

}
