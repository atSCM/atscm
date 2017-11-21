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
 * Custom Atvise File Type for node configurations
 * @type {node-opcua~NodeId}
 */
const AtviseReferenceConfigResourceId = new _NodeId2.default('Custom.AtvReferenceConfig');

/**
 * Mapping item object for atvise reference configurations
 */

class AtviseReferenceItem extends _InstanceReferenceItem2.default {

  /**
   * Creates a new InstanceAtviseReferenceItem.
   * @param {node-opcua~NodeId} nodeId The browsed nodeId.
   * @param {node-opcua~ReferenceDescription[]} references An array of
   * {@link node-opcua~ReferenceDescription}s
   * to create the atvise reference config item for
   */
  constructor(nodeId, references) {
    if (!(0, _validation2.default)(nodeId, _NodeId2.default) || !(0, _validation2.default)(references, _nodeOpcua.browse_service.ReferenceDescription)) {
      throw new Error('AtviseReferenceMappingItem#constructor: Can not parse given arguments!');
    }

    super(nodeId, references, AtviseReferenceConfigResourceId);
  }

  /**
   * Returns a configuration object for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} ref The reference description to process
   * @return {String} The configuration object for the given reference
   */
  createRefConfig(ref) {
    return ref.nodeId.toString();
  }
}
exports.default = AtviseReferenceItem;
//# sourceMappingURL=AtviseReferenceItem.js.map