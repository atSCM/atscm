"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _opcua_node_ids = require("node-opcua/lib/opcua_node_ids");

var _Object = require("../../helpers/Object");

/**
 * Reverse map of {@link node-opcua~ReferenceTypeId}s.
 * @type {Map<number, node-opcua~ReferenceTypeId}
 */
const ReverseReferenceTypeIds = (0, _Object.reverse)(_opcua_node_ids.ReferenceTypeIds);
var _default = ReverseReferenceTypeIds;
exports.default = _default;
//# sourceMappingURL=ReverseReferenceTypeIds.js.map