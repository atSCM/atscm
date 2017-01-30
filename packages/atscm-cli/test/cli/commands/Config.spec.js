import expect from 'unexpected';
import { stub } from 'sinon';

import ConfigCommand from '../../../src/cli/commands/Config';
import Logger from '../../../src/lib/util/Logger';

/** @test {ConfigCommand} */
describe('ConfigCommand', function() {
  /** @test {ConfigCommand#run} */
  describe('#run', function() {
    beforeEach(function() {
      stub(Logger, 'info');
    });

    afterEach(function() {
      Logger.info.restore();
    });

    const command = new ConfigCommand('config', 'Print configuration.');

    it('should print the current configuration', function() {
      command.run({
        environment: {
          configPath: __filename,
        },
      });

      expect(Logger.info.calledOnce, 'to be', true);
      expect(Logger.info.lastCall.args[0], 'to match', new RegExp('^Configuration at'));
    });
  });
});
