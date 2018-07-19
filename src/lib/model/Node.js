import { ReferenceTypeIds as RealReferenceTypeIds } from 'node-opcua/lib/opcua_node_ids';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import { reverse } from '../helpers/Object';
import { sortReferences } from '../helpers/mapping';

export const ReferenceTypeIds = Object.assign({
  toParent: -1,
}, RealReferenceTypeIds);

export const ReferenceTypeNames = reverse(ReferenceTypeIds);

class ReferenceMap extends Map {

  addReference(type, nodeId) {
    const set = this.get(type);
    if (set) {
      set.add(nodeId);
    } else {
      this.set(type, new Set([nodeId]));
    }
  }

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

  toJSON() {
    return [...this]
      .reduce((result, [key, value]) => Object.assign(result, {
        [ReferenceTypeNames[key] || key]: [...value],
      }), {});
  }

}

export default class Node {

  constructor({ name, parent, nodeClass/* , referenceToParent */ }) {
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
    this._resolved = new Set();

    this.references = new ReferenceMap();
    this._resolvedReferences = new ReferenceMap();
    this._unresolvedReferences = new ReferenceMap();

    this._parentResolvesMetadata = false;
  }

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

  get _filePath() {
    if (!this.parent) { return [this.fileName]; }
    return this.parent._filePath.concat(this.fileName);
  }

  get filePath() {
    if (!this.parent) { return []; }
    return this.parent._filePath;
  }

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

  get nodeId() {
    return this._nodeId.id;
  }

  get idPath() {
    return this.filePath;
  }

  get typeDefinition() {
    const refs = this.references.get(ReferenceTypeIds.HasTypeDefinition);
    return refs ? [...refs][0] : undefined;
  }

  hasTypeDefinition(typeDefName) {
    const def = this.typeDefinition;

    return def ? def === typeDefName : false;
  }

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

  get metadata() {
    if (this._parentResolvesMetadata) { return {}; }

    const meta = {};

    if (this.specialId) {
      meta.nodeId = this.specialId;
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

  createChild({ extension }) {
    const node = new Node({
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

  get dataType() {
    return this.value.dataType;
  }

  get arrayType() {
    return this.value.arrayType;
  }

  get isVariable() {
    return this.nodeClass === NodeClass.Variable;
  }

  // FIXME: Move to display / script transformers
  get isDisplay() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.Display');
  }

  get isScript() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.ScriptCode');
  }

  get isQuickDynamic() {
    return this.hasTypeDefinition('VariableTypes.ATVISE.QuickDynamic');
  }

}

export class ServerNode extends Node {


}
