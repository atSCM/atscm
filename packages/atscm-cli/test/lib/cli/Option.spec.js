import expect from 'unexpected';

import Option from '../../../src/lib/cli/Option';

/** @test {Option} */
describe('Option', function() {
  /** @test {Option#constructor} */
  describe('#constructor', function() {
    it('should store description', function() {
      expect(new Option('description').desc, 'to equal', 'description');
    });

    it('should store all options passed', function() {
      const options = { test: 123 };

      expect(new Option('description', options), 'to have properties', options);
    });
  });

  /** @test {Option.boolean} */
  describe('.boolean', function() {
    it('should return an option', function() {
      expect(Option.boolean('description'), 'to be a', Option);
    });

    it('should set type to boolean', function() {
      expect(Option.boolean('description').type, 'to equal', 'boolean');
    });

    it('should store all options passed', function() {
      const options = { test: 123 };

      expect(Option.boolean('description', options), 'to have properties', options);
    });
  });

  /** @test {Option.string} */
  describe('.string', function() {
    it('should return an option', function() {
      expect(Option.string('description'), 'to be a', Option);
    });

    it('should set type to string', function() {
      expect(Option.string('description').type, 'to equal', 'string');
    });

    it('should store all options passed', function() {
      const options = { test: 123 };

      expect(Option.string('description', options), 'to have properties', options);
    });
  });
});
