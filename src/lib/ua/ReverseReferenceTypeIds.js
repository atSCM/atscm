import { ReferenceTypeIds } from 'node-opcua';

/**
 * Reverse map of {node-opcua~ReferenceTypeId}'s
 * @type {Object}
 */
const ReverseReferenceTypeIds = (function() {
  Object.entries(ReferenceTypeIds)
    .forEach(([key, value]) => (this[key] = value));
  return this;
}).bind({})();


export default ReverseReferenceTypeIds;
