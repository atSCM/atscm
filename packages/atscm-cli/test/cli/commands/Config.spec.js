import expect from 'unexpected';

import ConfigCommand from '../../../src/cli/commands/Config';

/** @test {ConfigCommand} */
describe('ConfigCommand', function() {
  /** @test {ConfigCommand#run} */
  describe('#run', function() {
    it('is not implemented yet', function() {
      expect(() => (new ConfigCommand('config', 'Validate and print the config file.')).run(),
        'to throw error', 'Not implemented yet');
    });
  });
});
