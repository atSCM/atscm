import expect from 'unexpected';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';

const get = stub().resolves({ data: { latest: '0.3.0', beta: '0.4.0-beta.3' } });
const run = stub().resolves(`+ atscm@0.3.0
updated 1 package and moved 3 packages in 16.652s`);

const UpdateCommand = proxyquire('../../../src/cli/commands/Update', {
  axios: { get },
  '../../lib/util/ExternalCommand': {
    default: {
      run,
    },
  },
}).default;

/** @test {UpdateCommand} */
describe('UpdateCommand', function() {
  beforeEach(function() {
    get.resetHistory();
    run.resetHistory();
  });

  /** @test {UpdateCommand#getLatestVersion} */
  describe('#getLatestVersion', function() {
    it('should call npm api', function() {
      return expect(
        UpdateCommand.prototype.getLatestVersion(),
        'to be fulfilled with',
        '0.3.0'
      ).then(() => expect(get.calledOnce, 'to be', true));
    });

    it('should return beta versions with `useBetaRelease`', function() {
      return expect(UpdateCommand.prototype.getLatestVersion(true), 'to be fulfilled')
        .then(version => expect(version, 'to match', /.*-beta.[0-9]+/))
        .then(() => expect(get.calledOnce, 'to be', true));
    });
  });

  /** @test {UpdateCommand#updateNeeded} */
  describe('#updateNeeded', function() {
    it('should return false if latest is older than current version', function() {
      return expect(UpdateCommand.prototype.updateNeeded('0.1.0', '0.2.0'), 'to be', false);
    });

    it('should return false if latest equals current version', function() {
      return expect(UpdateCommand.prototype.updateNeeded('0.2.0', '0.2.0'), 'to be', false);
    });

    it('should return latest version if latest is newer than current version', function() {
      return expect(UpdateCommand.prototype.updateNeeded('0.3.0', '0.2.0'), 'to be', '0.3.0');
    });
  });

  /** @test {UpdateCommand#update} */
  describe('#update', function() {
    it('should run npm install', function() {
      return expect(
        UpdateCommand.prototype.update({
          environment: {
            cwd: 'test cwd',
          },
        }),
        'to be fulfilled'
      )
        .then(() => expect(run.calledOnce, 'to be', true))
        .then(() =>
          expect(run.lastCall.args, 'to equal', [
            'npm',
            ['install', '--save-dev', 'atscm@latest'],
            {
              spawn: {
                cwd: 'test cwd',
              },
            },
          ])
        );
    });

    it('should install beta with `useBetaRelease`', function() {
      return expect(
        UpdateCommand.prototype.update(
          {
            environment: {
              cwd: 'test cwd',
            },
          },
          true
        ),
        'to be fulfilled'
      )
        .then(() => expect(run.calledOnce, 'to be', true))
        .then(() =>
          expect(run.lastCall.args, 'to equal', [
            'npm',
            ['install', '--save-dev', 'atscm@beta'],
            {
              spawn: {
                cwd: 'test cwd',
              },
            },
          ])
        );
    });
  });

  /** @test {UpdateCommand#requiresEnvironment} */
  describe('#requiresEnvironment', function() {
    it('should always return true', function() {
      expect(UpdateCommand.prototype.requiresEnvironment(), 'to be', true);
    });
  });

  /** @test {UpdateCommand#run} */
  describe('#run', function() {
    const command = new UpdateCommand();

    it('should not call #update if not required', function() {
      return expect(
        command.run({
          environment: {
            modulePackage: {
              version: '0.3.0',
            },
          },
          options: {},
        }),
        'to be fulfilled'
      ).then(() => expect(run.callCount, 'to equal', 0));
    });

    it('should call #update if required', function() {
      return expect(
        command.run({
          environment: {
            modulePackage: {
              version: '0.2.0',
            },
          },
          options: {},
        }),
        'to be fulfilled'
      ).then(() => expect(run.calledOnce, 'to be', true));
    });
  });
});
