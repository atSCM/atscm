import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { join } from 'path';

const openSpy = spy();
const DocsCommand = proxyquire('../../../src/cli/commands/Docs', {
  open: openSpy,
}).default;

/** @test {DocsCommand} */
describe('DocsCommand', function() {
  const command = new DocsCommand('docs', 'Open documentation.');

  /** @test {DocsCommand#localDocsPath} */
  describe('#localDocsPath', function() {
    it('should be local api docs by default', function() {
      expect(
        command.localDocsPath({
          options: {},
          environment: {
            modulePath: '/path/to/package.json',
          },
        }),
        'to equal', join('/path/docs/api/index.html')
      );
    });

    it('should be cli api docs with --cli option', function() {
      expect(
        command.localDocsPath({
          options: { cli: true },
        }),
        'to equal', join(__dirname, '../../../docs/api/index.html')
      );
    });
  });

  /** @test {DocsCommand#remoteDocsUrl} */
  describe('#remoteDocsUrl', function() {
    it('should return path to atscm docs by default', function() {
      expect(command.remoteDocsUrl({ options: {} }),
        'to equal', `${DocsCommand.RemoteDocsBase}atscm`);
    });

    it('should return path to atscm-cli docs with `--cli` option passed', function() {
      expect(command.remoteDocsUrl({ options: { cli: true } }),
        'to equal', `${DocsCommand.RemoteDocsBase}atscm-cli`);
    });
  });

  /** @test {DocsCommand#addressToOpen} */
  describe('#addressToOpen', function() {
    it('should return local path if not remote option was passed', function() {
      const { address, isPath } = command.addressToOpen({
        options: {},
        environment: { modulePath: '/path/to/package.json' }
      });

      expect(address, 'to equal', join('/path/docs/api/index.html'));
      expect(isPath, 'to equal', true);
    });

    it('should return local path if remote option was set to false', function() {
      const { isPath } = command.addressToOpen({
        options: { remote: false },
        environment: { modulePath: '/path/to/package.json' }
      });

      expect(isPath, 'to equal', true);
    });

    it('should return remote url if remote was set to true', function() {
      const { isPath } = command.addressToOpen({
        options: { remote: true },
        environment: { modulePath: '/path/to/package.json' }
      });

      expect(isPath, 'to equal', false);
    });

    it('should return remote url if cli.env.modulePath is undefined', function() {
      const { isPath } = command.addressToOpen({
        options: { remote: true },
        environment: {}
      });

      expect(isPath, 'to equal', false);
    });

    it('should return local path if cli option was set', function() {
      const { isPath } = command.addressToOpen({
        options: { cli: true },
        environment: {}
      });

      expect(isPath, 'to equal', true);
    });
  });

  /** @test {DocsCommand#run} */
  describe('#run', function() {
    beforeEach(() => openSpy.resetHistory());

    it('should open local api docs by default', function() {
      command.run({
        options: {},
        environment: {
          modulePath: '/path/to/package.json',
        },
      })
        .then(() => {
          expect(openSpy.calledOnce, 'to be', true);
          expect(openSpy.lastCall.args[0], 'to equal', join('/path/docs/api/index.html'));
          expect(openSpy.lastCall.args[1], 'to be undefined');
        });
    });

    it('should open cli api docs with --cli option', function() {
      command.run({
        options: {
          cli: true,
        },
      })
        .then(() => {
          expect(openSpy.calledOnce, 'to be', true);
          expect(openSpy.lastCall.args[0],
            'to equal', join(__dirname, '../../../docs/api/index.html'));
          expect(openSpy.lastCall.args[1], 'to be undefined');
        });
    });

    it('should open in specific browser with --browser option', function() {
      command.run({
        options: {
          cli: false,
          browser: 'custombrowser',
        },
        environment: {
          modulePath: '/path/to/package.json',
        },
      })
        .then(() => {
          expect(openSpy.calledOnce, 'to be', true);
          expect(openSpy.lastCall.args[0], 'to equal', join('/path/docs/api/index.html'));
          expect(openSpy.lastCall.args[1], 'to equal', 'custombrowser');
        });
    });

    it('should call AtSCMCli#getEnvironment if no environment was passed', function() {
      const cli = {
        options: {
          cli: false,
        },
        getEnvironment() {
          return Promise.resolve((this.environment = {
            modulePath: '/path/to/package.json',
          }));
        }
      };

      spy(cli, 'getEnvironment');

      command.run(cli)
        .then(() => {
          expect(cli.getEnvironment.calledOnce, 'to be', true);
          expect(openSpy.calledOnce, 'to be', true);
          expect(openSpy.lastCall.args[0], 'to equal', join('/path/docs/api/index.html'));
        });
    });

    it('should open remote docs with --remote option passed', function() {
      command.run({
        options: {
          remote: true,
        },
        environment: {
          modulePath: '/path/to/package.json',
        },
      })
        .then(() => {
          expect(openSpy.calledOnce, 'to be', true);
          expect(openSpy.lastCall.args[0], 'to begin with', DocsCommand.RemoteDocsBase);
        });
    });
  });

  /** @test {DocsCommand#requiresEnvironment} */
  describe('#requiresEnvironment', function() {
    it('should return false if `--cli` is used', function() {
      expect(command.requiresEnvironment({ options: { cli: true } }), 'to be', false);
    });

    it('should return false if `--remote`', function() {
      expect(command.requiresEnvironment({ options: { remote: true } }), 'to be', false);
    });

    it('should return false if no `--remote` option is passed', function() {
      expect(command.requiresEnvironment({ options: { } }), 'to be', false);
    });

    it('should return false if `--no-remote` and `--cli` option is passed', function() {
      expect(command.requiresEnvironment({ options: {
        remote: false,
        cli: true,
      } }), 'to be', false);
    });

    it('should return true if `--no-remote` and no `--cli` option is passed', function() {
      expect(command.requiresEnvironment({ options: { remote: false } }), 'to be', true);
    });
  });
});
