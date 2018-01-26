'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _validation = require('../../util/validation');

var _validation2 = _interopRequireDefault(_validation);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _InstanceReferenceItem = require('./InstanceReferenceItem');

var _InstanceReferenceItem2 = _interopRequireDefault(_InstanceReferenceItem);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Custom Atvise File Type for instance type definitions
 * @type {node-opcua~NodeId}
 */
const InstanceTypeDefinitionConfigResourceId = new _NodeId2.default('Custom.InstanceTypeDefinition');

/**
 * Map to translate type node classes to the corresponding instance node classes
 * @type {Map<node-opcua~NodeClass, node-opcua~NodeClass>}
 */
const InstanceNodeClasses = {
  [_nodeOpcua.NodeClass.ObjectType]: _nodeOpcua.NodeClass.Object,
  [_nodeOpcua.NodeClass.VariableType]: _nodeOpcua.NodeClass.Variable
};

/**
 * Contains a the node configuration of an atvise node including the type definition
 * and references
 */

class InstanceTypeDefinitionItem extends _InstanceReferenceItem2.default {

  /**
   * Creates a new InstanceTypeDefinitionItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription} reference The{@link node-opcua~ReferenceDescription}
   * to create the type definition item for
   */
  constructor(nodeId, references) {
    if (!(0, _validation2.default)(nodeId, _NodeId2.default) || !(0, _validation2.default)(references, _nodeOpcua.browse_service.ReferenceDescription)) {
      throw new Error('InstanceTypeDefinitionItem#constructor: Can not parse given arguments!');
    }

    super(nodeId, references, InstanceTypeDefinitionConfigResourceId);
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @param {NodeId} nodeId browsed nodeId
   * @return {Object} The configuration object for the given reference
   */
  createRefConfig(ref, nodeId) {
    // eslint-disable-line no-unused-vars
    return {
      refNodeId: ref.nodeId.toString(),
      nodeClass: InstanceNodeClasses[ref.$nodeClass]
    };
  }
}
exports.default = InstanceTypeDefinitionItem;
//# sourceMappingURL=InstanceTypeDefinitionItem.js.map