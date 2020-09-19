import expect from 'unexpected';
import { getStat, validateDirectoryExists } from '../../../src/util/fs';

/** @test {getStat} */
describe('getStat', function () {
  it('should be fulfilled with valid path', function () {
    return expect(getStat('./package.json'), 'to be fulfilled');
  });

  it('should be rejected with invalid path', function () {
    return expect(getStat('./does-not-exist'), 'to be rejected');
  });
});

/** @test {validateDirectoryExists} */
describe('validateDirectoryExists', function () {
  it('should be rejected with invalid path', function () {
    return expect(validateDirectoryExists('./does-not-exist'), 'to be rejected');
  });

  it('shoud be rejected with non-directory path', function () {
    return expect(validateDirectoryExists('./package.json'), 'to be rejected');
  });

  it('should be fulfilled with directory path ', function () {
    return expect(validateDirectoryExists('./test'), 'to be fulfilled');
  });
});
