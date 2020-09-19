import { ReferenceTypeIds } from 'node-opcua';
import expect from '../../../../expect';
import ReverseReferenceTypeIds from '../../../../../src/lib/model/opcua/ReverseReferenceTypeIds';

/* @test {ReverseReferenceTypeIds} */
describe('ReverseReferenceTypeIds', function() {
  it('should export values for all node-opcua~ReferenceTypeIds', function() {
    Object.entries(ReferenceTypeIds).forEach(([key, value]) => {
      expect(ReverseReferenceTypeIds[value], 'to be defined');
      expect(ReverseReferenceTypeIds[value], 'to equal', key);
    });
  });
});
