import {ReferenceTypeIds} from 'node-opcua';

/**
 * Reverse map of {node-opcua~ReferenceTypeId}'s
 * @type {Object}
 */
const  ReverseReferenceTypeIds = (function () {
  Object.entries(ReferenceTypeIds).map(keyValuePair => this[keyValuePair[1]] = keyValuePair[0]);
  return this;
}).bind({})();


export default ReverseReferenceTypeIds;
