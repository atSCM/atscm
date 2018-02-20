import { ReferenceTypeIds } from 'node-opcua';
import { reverse } from '../../helpers/Object';

/**
 * Reverse map of {@link node-opcua~ReferenceTypeId}s.
 * @type {Map<number, node-opcua~ReferenceTypeId}
 */
const ReverseReferenceTypeIds = reverse(ReferenceTypeIds);

export default ReverseReferenceTypeIds;
