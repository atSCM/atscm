import expect from 'unexpected';

import RunCommand from '../../../src/cli/commands/Run';

/** @test {RunCommand} */
describe('RunCommand', function() {
  /** @test {RunCommand#run} */
  describe('#run', function() {
    it('is not implemented yet', function() {
      expect(() => (new RunCommand('run', 'Run tasks')).run(),
        'to throw error', 'Not implemented yet');
    });
  });
});
