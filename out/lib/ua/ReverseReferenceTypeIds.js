'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

/**
 * Reverse map of {node-opcua~ReferenceTypeId}'s
 * @type {Object}
 */
const ReverseReferenceTypeIds = function () {
  // eslint-disable-next-line no-return-assign
  Object.entries(_nodeOpcua.ReferenceTypeIds).map(keyValuePair => this[keyValuePair[1]] = keyValuePair[0]);
  return this;
}.bind({})();

exports.default = ReverseReferenceTypeIds;
//# sourceMappingURL=ReverseReferenceTypeIds.js.map