import expect from 'unexpected';
import { spy, stub } from 'sinon';

import Liftoff from 'liftoff';
import AtSCMCli from '../src/AtSCMCli';
import UsageError from '../src/lib/error/UsageError';
import Logger from '../src/lib/util/Logger';
import Command from '../src/lib/cli/Command';
import pkg from '../package.json';

/** @test {AtSCMCli} */
describe('AtSCMCli', function() {
  /** @test {AtSCMCli#constructor} */
  describe('#constructor', function() {
    it('should create an instance of Liftoff', function() {
      expect(new AtSCMCli(), 'to be a', Liftoff);
    });

    it('should not add run argument if valid command is given', function() {
      expect((new AtSCMCli(['docs']))._argv, 'to equal', ['docs']);
    });

    it('should not add run argument if --help is given', function() {
      expect((new AtSCMCli(['--help']))._argv, 'to equal', ['--help']);
    });

    it('should not add run argument if --version is given', function() {
      expect((new AtSCMCli(['--version']))._argv, 'to equal', ['--version']);
    });

    it('should add run argument if no command is given', function() {
      expect((new AtSCMCli())._argv, 'to equal', ['run']);
    });

    it('should set runViaCli', function() {
      // runViaCli is always set to false as we don't run this test from the command line directly.
      expect((new AtSCMCli()).runViaCli, 'to equal', false);
    });
  });

  /** @test {AtSCMCli#parseArguments} */
  describe('#parseArguments', function() {
    const unknownArgCli = new AtSCMCli(['--unknown']);

    it('should fail with UsageError with an unknown argument', function() {
      return expect(unknownArgCli.parseArguments(), 'when rejected', 'to be a', UsageError);
    });

    it('should report the invalid argument', function() {
      return expect(unknownArgCli.parseArguments(), 'when rejected',
        'to have message', 'Unknown argument: unknown'
      );
    });

    it('should return options with valid arguments', function() {
      return expect((new AtSCMCli(['docs', '--cli'])).parseArguments(), 'when fulfilled',
        'to have properties', { _: ['docs'], cli: true }
      );
    });

    it('should set AtSCMCli#options with valid arguments', function() {
      const cli = new AtSCMCli(['docs', '--cli']);

      return cli.parseArguments()
        .then(opts => expect(cli.options, 'to equal', opts));
    });

    it('should set AtSCMCli#command with valid command', function() {
      const cli = new AtSCMCli(['docs', '--cli']);

      return cli.parseArguments()
        .then(() => expect(cli.command.name, 'to equal', 'docs'));
    });
  });

  /** @test {AtSCMCli#getEnvironment} */
  describe('#getEnvironment', function() {
    beforeEach(() => spy(Liftoff.prototype, 'launch'));
    afterEach(() => Liftoff.prototype.launch.restore());

    const cli = new AtSCMCli([
      '--cwd', 'test/fixtures',
      '--projectfile', 'test/fixtures/Atviseproject.js',
    ]);

    it('should call Liftoff#launch with cwd and projectfile option', function() {
      return cli.getEnvironment()
        .then(() => {
          expect(Liftoff.prototype.launch.calledOnce, 'to be', true);
          expect(Liftoff.prototype.launch.lastCall.args[0], 'to equal', {
            cwd: 'test/fixtures',
            configPath: 'test/fixtures/Atviseproject.js',
          });
        });
    });

    it('should set AtSCMCli#environment', function() {
      return cli.getEnvironment()
        .then(env => {
          expect(cli.environment, 'to be defined');
          expect(cli.environment, 'to equal', env);
          expect(cli.environment, 'to have keys',
            ['cwd', 'configPath', 'configBase', 'modulePath', 'modulePackage']
          );
        });
    });
  });

  /** @test {AtSCMCli#requireEnvironment} */
  describe('#requireEnvironment', function() {
    it('should fail without local module', function() {
      return expect((new AtSCMCli()).requireEnvironment(),
        'to be rejected with', /Local .* not found/);
    });

    it('should return environment if successful', function() {
      const cli = (new AtSCMCli(['--cwd', 'test/fixtures']));

      return expect(cli.requireEnvironment(),
        'when fulfilled', 'to have values satisfying', 'not to be falsy');
    });
  });

  /** @test {AtSCMCli#getVersion} */
  describe('#getVersion', function() {
    it('should return cli version without local module', function() {
      return expect((new AtSCMCli()).getVersion(), 'when fulfilled',
        'to equal', { cli: pkg.version, local: null });
    });

    it('should even return cli version with invalid cwd', function() {
      return expect((new AtSCMCli(['--cwd', 'invalid/path'])).getVersion(), 'when fulfilled',
        'to equal', { cli: pkg.version, local: null });
    });

    it('should return local version with local module', function() {
      return expect((new AtSCMCli(['--cwd', 'test/fixtures'])).getVersion(), 'to be fulfilled with',
        { cli: pkg.version, local: 'latest' });
    });
  });

  /** @test {AtSCMCli#printVersion} */
  describe('#printVersion', function() {
    beforeEach(() => stub(Logger, 'info'));
    afterEach(() => Logger.info.restore());

    it('should print cli version only without local module', function() {
      return expect((new AtSCMCli()).printVersion(), 'to be fulfilled')
        .then(() => {
          expect(Logger.info.calledOnce, 'to be', true);
          expect(Logger.info.lastCall.args[0], 'to match', /CLI version/);
          expect(Logger.info.lastCall.args[1], 'to match', new RegExp(pkg.version));
        });
    });

    it('should print cli and local version with local module', function() {
      return expect((new AtSCMCli(['--cwd', 'test/fixtures'])).printVersion(), 'to be fulfilled')
        .then(() => {
          expect(Logger.info.calledTwice, 'to be', true);
          expect(Logger.info.lastCall.args[0], 'to match', /Local version/);
          expect(Logger.info.lastCall.args[1], 'to match', /latest/);
        });
    });
  });

  /** @test {AtSCMCli#runCommand} */
  describe('#runCommand', function() {
    it('should print version if --version is used', function() {
      const cli = new AtSCMCli(['--version']);
      cli.options.version = true;

      spy(cli, 'printVersion');

      return cli.runCommand()
        .then(() => {
          expect(cli.printVersion.calledOnce, 'to be', true);
        });
    });

    it('should run command if used', function() {
      const command = new Command('cmd', 'Just testing');
      stub(command, 'run');
      const cli = new AtSCMCli(['--cwd', 'test/fixtures']);
      cli.command = command;

      return cli.runCommand()
        .then(() => {
          expect(command.run.calledOnce, 'to be true');
        });
    });

    before(() => spy(Logger, 'warn'));
    after(() => Logger.warn.restore());

    it('should warn if no command is used', function() {
      const cli = new AtSCMCli(['--cwd', 'test/fixtures']);

      return cli.runCommand()
        .then(() => {
          expect(Logger.warn.calledOnce, 'to be', true);
          expect(Logger.warn.lastCall.args[0], 'to contain', 'No command specified');
        });
    });
  });

  /** @test {AtSCMCli#launch} */
  describe('#launch', function() {
    it('should call AtSCMCli#parseArguments', function() {
      const cli = new AtSCMCli();
      spy(cli, 'parseArguments');
      stub(cli, 'runCommand', () => Promise.resolve(true));

      return cli.launch()
        .then(() => {
          expect(cli.runCommand.calledOnce, 'to be true');
          expect(cli.parseArguments.calledOnce, 'to be', true);
        });
    });

    it('should handle all exceptions if run via cli', function() {
      const cli = new AtSCMCli();
      cli.runViaCli = true;
      stub(cli, 'runCommand', () => Promise.reject(new Error('test')));

      return expect(cli.launch(), 'to be fulfilled');
    });

    it('should report help on usage errors if run via cli', function() {
      const cli = new AtSCMCli(['--unknown']);
      cli.runViaCli = true;

      return expect(cli.launch(), 'to be fulfilled');
    });
  });
});
