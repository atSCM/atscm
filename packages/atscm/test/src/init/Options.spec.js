import expect from 'unexpected';
import InitOptionsAsArray, { InitOptions } from '../../../src/init/Options';
import InitOption from '../../../src/lib/init/Option';

/** @test {InitOptions} */
describe('InitOptions', function () {
  it('should contain InitOptions stored against names', function () {
    Object.keys(InitOptions).forEach((key) => {
      expect(key, 'to be a', 'string');
      expect(InitOptions[key], 'to be a', InitOption);
    });
  });

  /** @test {InitOptions.atviseUser} */
  describe('.atviseUser', function () {
    it('should only be asked if using login', function () {
      expect(InitOptions.atviseUser.when({ useLogin: false }), 'to equal', false);
      expect(InitOptions.atviseUser.when({ useLogin: true }), 'to equal', true);
    });
  });

  /** @test {InitOptions.atvisePassword} */
  describe('.atvisePassword', function () {
    it('should only be asked if using login', function () {
      expect(InitOptions.atvisePassword.when({ useLogin: false }), 'to equal', false);
      expect(InitOptions.atvisePassword.when({ useLogin: true }), 'to equal', true);
    });
  });
});

/** @test {InitOptionsAsArray} */
describe('InitOptionsAsArray', function () {
  it('should contain all InitOptions', function () {
    InitOptionsAsArray.forEach((opt) => {
      expect(InitOptions[opt.name], 'to be defined');
      expect(opt, 'to have properties', InitOptions[opt.name]);
    });
  });
});
