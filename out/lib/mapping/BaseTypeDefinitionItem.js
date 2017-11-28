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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Custom Atvise File Type for base type definitions
 * @type {node-opcua~NodeId}
 */
const BaseTypeDefinitionResourceId = new _NodeId2.default('Custom.BaseTypeDefinition');

/**
 * Mapping item object for variable nodes
 */

class BaseTypeDefinitionItem extends _MappingItem2.default {

  /**
   * Creates a new ReadNodeItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription} reference The {@link node-opcua~ReferenceDescription}
   * to create the read node mapping item for.
   */
  constructor(nodeId, reference) {
    if (!(0, _validation2.default)(nodeId, _NodeId2.default) || !(0, _validation2.default)(reference, _nodeOpcua.browse_service.ReferenceDescription)) {
      throw new Error('BaseTypeDefinitionItem#constructor: Can not parse given arguments!');
    }

    super(reference.nodeId);

    /**
     * configItem source
     * @type {node-opcua~ReferenceDescription}
     */
    this.source = reference;

    this.config = {
      nodeId: reference.nodeId,
      dataType: _nodeOpcua.DataType.String,
      arrayType: _nodeOpcua.VariantArrayType.Scalar,
      value: JSON.stringify(this.createRefConfigObj(reference)),
      typeDefinition: BaseTypeDefinitionResourceId
    };
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
   * @return {Object} The configuration object for the given reference
   */
  createRefConfigObj(ref) {
    return {
      nodeClass: ref.$nodeClass.key,
      refNodeId: ref.typeDefinition.toString()
    };
  }
}
exports.default = BaseTypeDefinitionItem;
//# sourceMappingURL=BaseTypeDefinitionItem.js.map