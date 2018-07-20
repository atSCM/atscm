import { ReferenceTypeIds as RealReferenceTypeIds } from 'node-opcua/lib/opcua_node_ids';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { reverse } from '../helpers/Object';
import { sortReferences } from '../helpers/mapping';

/**
 * References type ids.
 * @type {Map<string, number>}
 */
export const ReferenceTypeIds = Object.assign({
  toParent: -1,
}, RealReferenceTypeIds);

/**
 * Names for references.
 * @type {Map<number, string>}
 */
export const ReferenceTypeNames = reverse(ReferenceTypeIds);

/**
 * A map specialized for holding references.
 */
class ReferenceMap extends Map {

  /**
   * Adds a new reference.
   * @param {number} type The reference id.
   * @param {string} nodeId The reference target node's id.
   */
  addReference(type, nodeId) {
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
  deleteReference(type, nodeId) {
    const set = this.get(type);
    if (set) {
      const ref = set.delete(nodeId);

      if (ref) {
        if (set.size === 0) {
          this.delete(type);
        }
        return ref;
      }
    }

    throw new Error(`No ${ReferenceTypeNames[type] || type} reference to ${nodeId}`);
  }

  /**
   * Returns a plain object of refernces.
   * @type {Object}
   */
  toJSON() {
    return [...this]
      .reduce((result, [key, value]) => Object.assign(result, {
        [ReferenceTypeNames[key] || key]: [...value],
      }), {});
  }

}

/**
 * The main model class.
 */
export default class Node {

  /**
   * Creates a new node.
   * @param {Object} options The options to use.
   * @param {string} options.name The node's name.
   * @param {Node} options.parent The node's parent node.
   * @param {node-opcua~NodeClass} options.nodeClass The node's class.
   */
  constructor({ name, parent, nodeClass/* , referenceToParent */ }) {
    /** The node's name when stored to a file. {@type string} */
    this.fileName = name;
    /** The node's name when written to the server. {@type string} */
    this.idName = name;
    /** The node's parent node. {@type Node} */
    this.parent = parent;
    /** The node's class. {@type node-opcua~NodeClass} */
    this.nodeClass = nodeClass;

    /**
     * A set of unresolved properties.
     * @type {Set<string>}
     */
    this._unresolved = new Set([
      'nodeClass',
      // Only for variables
      'dataType',
      'arrayType',
    ]);
    /**
     * A set of resolved properties.
     * @type {Set<string>}
     */
    this._resolved = new Set();

    /**
     * The node's refernces.
     * @type {ReferenceMap}
     */
    this.references = new ReferenceMap();
    /**
     * The node's unresolved refernces.
     * @type {ReferenceMap}
     */
    this._resolvedReferences = new ReferenceMap();
    /**
     * The node's resolved refernces.
     * @type {ReferenceMap}
     */
    this._unresolvedReferences = new ReferenceMap();

    /**
     * If the parent node resolves metadata.
     * @type {boolean}
     */
    this._parentResolvesMetadata = false;
  }

  /**
   * If the parent resolves metadata (for example: split transformer source files).
   * @type {boolean}
   */
  get parentResolvesMetadata() {
    return this._parentResolvesMetadata;
  }

  markAsResolved(key) {
    const value = this._unresolved.delete(key);

    // FIXME: Only test if debug / test
    if (value === false) {
      throw new Error(`'${key}' is already resolved`);
    }

    this._resolved.add(key);
  }

  isResolved(key) {
    return this._resolved.has(key);
  }

  /**
   * Adds a new reference.
   * @param {number} type The reference type's id.
   * @param {string} id The reference target node's id.
   */
  addReference(type, id) {
    this.references.addReference(type, id);
    this._unresolvedReferences.addReference(type, id);
  }

  setReferences(type, ids) {
    this.references.set(type, new Set(ids));
    this._unresolvedReferences.set(type, new Set(ids));
  }

  markReferenceAsResolved(name, value) {
    const type = ReferenceTypeIds[name];
    const ref = this._unresolvedReferences.deleteReference(type, value);
    this._resolvedReferences.addReference(type, ref);
  }

  markAllReferencesAsResolved(name) {
    const type = ReferenceTypeIds[name];
    this._unresolvedReferences.delete(type);
  }

  hasUnresolvedReference(name) {
    const type = ReferenceTypeIds[name];
    return this._unresolvedReferences.has(type);
  }

  /**
   * The node's file path, used to compute {@link Node#filePath}.
   */
  get _filePath() {
    if (!this.parent) { return [this.fileName]; }
    return this.parent._filePath.concat(this.fileName);
  }

  /**
   * The node's file path.
   * @type {string[]}
   */
  get filePath() {
    if (!this.parent) { return []; }
    return this.parent._filePath;
  }

  /**
   * The node's id, used to compute {@link Node#nodeId}.
   * @type {string}
   */
  get _nodeId() {
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
   * @type {string}
   */
  get nodeId() {
    return this._nodeId.id;
  }

  /**
   * The node's type definition if given.
   * @type {?number}
   */
  get typeDefinition() {
    const refs = this.references.get(ReferenceTypeIds.HasTypeDefinition);
    return refs ? [...refs][0] : undefined;
  }

  /**
   * Returns `true` if the node has the given type definition.
   * @param {string} typeDefName The type definition to check.
   * @return {boolean} If the node has the given type definition.
   */
  hasTypeDefinition(typeDefName) {
    const def = this.typeDefinition;

    return def ? def === typeDefName : false;
  }

  /**
   * `true` at the moment.
   * @type {boolean}
   */
  get hasUnresolvedMetadata() {
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
  get metadata() {
    if (this._parentResolvesMetadata) { return {}; }

    const meta = {};

    if (this.specialId) {
      meta.nodeId = this.specialId;
    }

    if (this.specialName) {
      meta.name = this.specialName;
    }

    if (this.nodeClass === NodeClass.Variable) {
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
  createChild({ extension }) {
    const node = new Node({
      name: this.idName,
      parent: this,
      nodeClass: this.nodeClass,
    });

    Object.setPrototypeOf(node, this.constructor.prototype);

    node.fileName = `${this.fileName}${extension}`;

    node.references = this.references;
    node._parentResolvesMetadata = true;

    return node;
  }

  // Convenience getters

  /**
   * The node's data type.
   * @type {node-opcua~DataType}
   */
  get dataType() {
    return this.value.dataType;
  }

  /**
   * The node's array type.
   * @type {node-opcua~VariantArrayType}
   */
  get arrayType() {
    return this.value.arrayType;
  }

  /**
   * If the node is a variable.
   * @type {boolean}
   */
  get isVariable() {
    return this.nodeClass === NodeClass.Variable;
  }

  // FIXME: Move to display / script transformers

  /**
   * If the node is an object display.
   * @type {boolean}
   */
  get isDisplay() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.Display');
  }

  /**
   * If the node is a serverside script.
   * @type {boolean}
   */
  get isScript() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.ScriptCode');
  }

  /**
   * If the node is a quickdynamic.
   * @type {boolean}
   */
  get isQuickDynamic() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.QuickDynamic');
  }

}

/**
 * A node during a *pull*.
 */
export class ServerNode extends Node {

  /**
   * The node's name.
   * @type {string}
   */
  get name() {
    return this.fileName;
  }

  /**
   * Renames a node.
   * @param {string} name The name to set.
   */
  renameTo(name) {
    this.fileName = name;
  }

}

/**
 * A node during a *push*.
 */
export class SourceNode extends Node {

  /**
   * The node's name.
   * @type {string}
   */
  get name() {
    return this.idName;
  }

  /**
   * Renames a node.
   * @param {string} name The name to set.
   */
  renameTo(name) {
    this.idName = name;
  }

}
