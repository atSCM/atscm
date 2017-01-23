import expect from 'unexpected';

import Command from '../../../src/lib/cli/Command';
import Option from '../../../src/lib/cli/Option';

/** @test {Command} */
describe('Command', function() {
  const name = 'command';
  const run = () => true;
  const opts = { description: 'description' };
  const args = '<required> [optional...]'

  /** @test {Command#constructor} */
  describe('#constructor', function() {
    it('should fail without options.description', function() {
      expect(() => new Command(name, run),
        'to throw error', 'options.description is required');
    });

    it('should fail if options.maxArguments is less than options.maxArguments', function() {
      expect(() => new Command(name, run, Object.assign({
        minArguments: 1,
        maxArguments: 0,
      }, opts)), 'to throw error',
        'options.maxArguments must not be less than options.minArguments');
    });

    it('should store name, action and options', function() {
      const command = new Command(name, run, opts);

      expect(command.name, 'to equal', name);
      expect(command.run, 'to equal', run);
      expect(command._options, 'to equal', opts);
    });
  });

  /** @test {Command#usage} */
  describe('#usage', function() {
    it('should be only name with no options.arguments set', function() {
      expect((new Command(name, run, opts)).usage, 'to equal', name);
    });

    it('should be name followed by arguments with options.arguments set', function() {
      expect((new Command(name, run, Object.assign({ arguments: args }, opts))).usage,
        'to equal', `${name} ${args}`);
    });
  });

  /** @test {Command#options} */
  describe('#options', function() {
    it('should be empty object if options.options were not set', function() {
      expect((new Command(name, run, opts)).options, 'to equal', {});
    });

    it('should return all options passed as options.options', function() {
      const options = { test: new Option('description') };

      expect((new Command(name, run, Object.assign({ options }, opts))).options,
        'to equal', options);
    });
  });

  /** @test {Command#demandCommand} */
  describe('#demandCommand', function() {
    it('should default to [0]', function() {
      expect((new Command(name, run, opts)).demandCommand, 'to equal', [0]);
    });

    it('should be use options.maxArguments if set', function() {
      expect((new Command(name, run, Object.assign({ maxArguments: 13 }, opts))).demandCommand,
        'to equal', [0, 13]);
    });

    it('should be use options.minArguments if set', function() {
      expect((new Command(name, run, Object.assign({ minArguments: 13 }, opts))).demandCommand,
        'to equal', [13]);
    });

    it('should be use options.minArguments and options.maxArguments if set', function() {
      expect((new Command(name, run, Object.assign({
        minArguments: 1,
        maxArguments: 2,
      }, opts))).demandCommand, 'to equal', [1, 2]);
    });
  });

  /** @test {Command#description} */
  describe('#description', function() {
    it('should return value passed as options.description', function() {
      expect((new Command(name, run, opts)).description, 'to equal', opts.description);
    });
  });
});
