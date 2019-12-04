import { join } from 'path';
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
      stub(Logger, 'warn');
    });

    afterEach(function() {
      Logger.info.restore();
      Logger.warn.restore();
    });

    const command = new ConfigCommand('config', 'Print configuration.');

    context('when overrides are available (atscm >= v0.4)', function() {
      it("should print local module's ProjectConfig class", function() {
        command.run({
          options: {
            project: {},
          },
          environment: {
            modulePath: join(__dirname, '../../fixtures/node_modules/atscm/fake/v0-4.js'),
            configPath: join(__dirname, '../../fixtures/Atviseproject.js'),
          },
        });

        expect(Logger.info.calledOnce, 'to be', true);
        expect(Logger.info.lastCall.args[0], 'to match', new RegExp('^Configuration at'));
      });
    });

    context('when overrides are not available (atscm < v0.4)', function() {
      it("should print local module's Atviseproject class", function() {
        command.run({
          options: {
            project: {},
          },
          environment: {
            modulePath: join(__dirname, '../../fixtures/node_modules/atscm/fake/v0-3.js'),
            configPath: join(__dirname, '../../fixtures/Atviseproject.js'),
          },
        });

        expect(Logger.info.callCount, 'to equal', 2);
        expect(Logger.info.firstCall.args[0], 'to match', new RegExp('^Configuration at'));
      });

      it('should warn that overrides are not available', function() {
        command.run({
          options: {
            project: {},
          },
          environment: {
            modulePath: join(__dirname, '../../fixtures/node_modules/atscm/fake/v0-3.js'),
            configPath: join(__dirname, '../../fixtures/Atviseproject.js'),
          },
        });

        expect(Logger.warn.calledOnce, 'to be', true);
        expect(
          Logger.warn.lastCall.args[0],
          'to contain',
          'Overriding runtime configuration requires atscm version >= 0.4'
        );
      });
    });
  });
});
