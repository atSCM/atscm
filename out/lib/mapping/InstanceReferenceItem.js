'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _validation = require('../../util/validation');

var _validation2 = _interopRequireDefault(_validation);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _MappingItem = require('./MappingItem');

var _MappingItem2 = _interopRequireDefault(_MappingItem);

var _ReverseReferenceTypeIds = require('../ua/ReverseReferenceTypeIds');

var _ReverseReferenceTypeIds2 = _interopRequireDefault(_ReverseReferenceTypeIds);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Mapping item for node type definitions and other reference types
 * @abstract
 */
class InstanceReferenceItem extends _MappingItem2.default {

  /**
   * Creates a new InstanceReferenceItem
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   */
  constructor(nodeId, references, itemTypeDefinition) {
    if (!(0, _validation2.default)(nodeId, _NodeId2.default) || !(0, _validation2.default)(references, _nodeOpcua.browse_service.ReferenceDescription) || !(0, _validation2.default)(itemTypeDefinition, _NodeId2.default)) {
      throw new Error('InstanceReferenceItem#constructor: Can not parse given arguments!');
    }

    super(nodeId);

    /**
     * Mapping item configuration source
     * @type {node-opcua~ReferenceDescription[]}
     */
    this.source = references;

    /**
     * The item type definition
     * @type {node-opcua~NodeId}
     */
    this.itemTypeDefinition = itemTypeDefinition;

    const configObj = {};

    references.map(ref => this.addRefToConfig(ref, configObj));
    this.config = this.createConfigItem(configObj);
  }

  /**
   * `true` for read node mapping items.
   * @type {Boolean}
   */
  get shouldBeRead() {
    return false;
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @return {*} The configuration for the given reference
   * @abstract
   */
  createRefConfig(ref) {
    // eslint-disable-line no-unused-vars
    throw new Error('InstanceReferenceItem#createRefConfigObj must ' + 'be implemented by all subclasses');
  }

  /**
   * Adds the given {node-opcua~ReferenceDescription} to the config object.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @param {Object} refConfig The reference object to add the given reference
   */
  addRefToConfig(ref, refConfig) {
    const referenceName = _ReverseReferenceTypeIds2.default[ref.referenceTypeId.value];

    if (refConfig[referenceName]) {
      // eslint-disable-next-line no-param-reassign
      refConfig[referenceName].items.push(this.createRefConfig(ref));
    } else {
      // eslint-disable-next-line no-param-reassign
      refConfig[referenceName] = {
        referenceIdValue: _nodeOpcua.ReferenceTypeIds[referenceName],
        items: [this.createRefConfig(ref)]
      };
    }
  }

  /**
   * Creates a node configuration object for type definitions and atvise reference types
   * @param {Object} config The object that contains the reference configuration
   */
  createConfigItem(config) {
    return {
      nodeId: this.nodeId,
      dataType: _nodeOpcua.DataType.String,
      arrayType: _nodeOpcua.VariantArrayType.Scalar,
      value: JSON.stringify(config),
      typeDefinition: this.itemTypeDefinition
    };
  }
}
exports.default = InstanceReferenceItem;
//# sourceMappingURL=InstanceReferenceItem.js.map