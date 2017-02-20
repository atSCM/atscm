import expect from 'unexpected';

import File from 'vinyl';
import AtviseFile from '../../../../src/lib/server/AtviseFile';

/** @test {AtviseFile} */
describe('AtviseFile', function() {
  /** @test {AtviseFile#constructor} */
  describe('#constructor', function() {
    it('should create a vinyl instance', function() {
      const file = new AtviseFile();

      expect(file, 'to be a', File);
    });
  });
});
