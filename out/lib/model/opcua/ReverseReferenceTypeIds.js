'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Object = require('../../helpers/Object');

/**
 * Reverse map of {@link node-opcua~ReferenceTypeId}s.
 * @type {Map<number, node-opcua~ReferenceTypeId}
 */
const ReverseReferenceTypeIds = (0, _Object.reverse)(_nodeOpcua.ReferenceTypeIds);

exports.default = ReverseReferenceTypeIds;
//# sourceMappingURL=ReverseReferenceTypeIds.js.map