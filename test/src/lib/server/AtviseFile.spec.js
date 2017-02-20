import expect from 'unexpected';

import File from 'vinyl';
import AtviseFile from '../../../../src/lib/server/AtviseFile';
import NodeId from '../../../../src/lib/server/NodeId';

/** @test {AtviseFile} */
describe('AtviseFile', function() {
  /** @test {AtviseFile#constructor} */
  describe('#constructor', function() {
    it('should create a vinyl instance', function() {
      const file = new AtviseFile();

      expect(file, 'to be a', File);
    });
  });

  /** @test {AtviseFile#isDisplay} */
  describe('#isDisplay', function() {
    it('should return true for AtviseFiles with correct TypeDefinition', function() {
      expect((new AtviseFile({
        path: 'test.display',
        typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
      })).isDisplay, 'to be true');
    });
  });
});
