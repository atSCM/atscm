import expect from 'unexpected';
import Validator from '../../../src/init/OptionsValidator';

/** @test {InitOptionsValidator} */
describe('InitOptionsValidator', function() {
  /** @test {InitOptionsValidator.name} */
  describe('.name', function() {
    it('should fail for empty names', function() {
      expect(Validator.name(''), 'to match', /must be greater than zero/);
    });

    it('should fail with capital letters', function() {
      expect(Validator.name('atSCM'), 'to match', /can no longer contain capital letters/);
    });

    it('should fail with non-url-safe characters', function() {
      expect(Validator.name('#asdf'), 'to match', /URL-friendly characters/);
    });

    it('should fail with names starting with . or _', function() {
      expect(Validator.name('_atscm'), 'to match', /cannot start with an underscore/);
      expect(Validator.name('.atscm'), 'to match', /cannot start with a period/);
    });

    it('should fail with leading or trailing spaces', function() {
      expect(Validator.name(' atscm'), 'to match', /cannot contain leading or trailing spaces/);
      expect(Validator.name('atscm '), 'to match', /cannot contain leading or trailing spaces/);
    });

    it('should fail with core nodejs module name', function() {
      expect(Validator.name('http'), 'to match', /is a core module name/);
    });

    it('should fail with blacklisted name', function() {
      expect(Validator.name('node_modules'), 'to match', /is a blacklisted name/);
    });

    it('should fail with \'atscm\'', function() {
      expect(Validator.name('atscm'), 'to match', /is not allowed/);
    });

    it('should fail with names longer than 214 characters', function() {
      expect(Validator.name('a'.repeat(215)), 'to match', /can no longer contain more than 214/);
    });

    it('should work for valid package names', function() {
      expect(Validator.name('atscm'), 'to be', true);
    });
  });
});
