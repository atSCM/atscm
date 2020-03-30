import { join } from 'path';
import expect from 'unexpected';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import colors from 'chalk';
import Liftoff from 'liftoff';
import { LogFormat } from '../src/lib/util/Logger';
import UsageError from '../src/lib/error/UsageError';
import Command from '../src/lib/cli/Command';
import pkg from '../package.json';

const LoggerSpy = {
  debug: spy(),
  info: spy(),
  warn: spy(),
  error: spy(),
  applyOptions: spy(),
  colors,
  format: LogFormat,
};

const AtSCMCli = proxyquire('../src/AtSCMCli', {
  './lib/util/Logger': {
    _esModule: true,
    default: LoggerSpy,
  },
}).default;

/** @test {AtSCMCli} */
describe('AtSCMCli', function () {
  beforeEach(() => {
    LoggerSpy.debug.resetHistory();
    LoggerSpy.info.resetHistory();
    LoggerSpy.warn.resetHistory();
    LoggerSpy.error.resetHistory();
    LoggerSpy.applyOptions.resetHistory();
  });

  /** @test {AtSCMCli#constructor} */
  describe('#constructor', function () {
    it('should throw UsageError with invalid options', function () {
      expect(() => new AtSCMCli(['--cwd']), 'to throw');
    });

    it('should create an instance of Liftoff', function () {
      expect(new AtSCMCli(), 'to be a', Liftoff);
    });

    it('should not add run argument if valid command is given', function () {
      expect(new AtSCMCli(['docs'])._argv, 'to equal', ['docs']);
    });

    it('should not add run argument if --help is given', function () {
      expect(new AtSCMCli(['--help'])._argv, 'to equal', ['--help']);
    });

    it('should not add run argument if --version is given', function () {
      expect(new AtSCMCli(['--version'])._argv, 'to equal', ['--version']);
    });

    it('should add run argument if no command is given', function () {
      expect(new AtSCMCli()._argv, 'to equal', ['run']);
    });

    it('should set runViaCli', function () {
      // runViaCli is always set to false as we don't run this test from the command line directly.
      expect(new AtSCMCli().runViaCli, 'to equal', false);
    });
  });

  /** @test {AtSCMCli#_exposeOverride} */
  describe('#_exposeOverride', function () {
    it('should set single options', function () {
      AtSCMCli.prototype._exposeOverride({ test: 13 }, 'test', 'TEST_ENVS__');

      expect(process.env.TEST_ENVS__TEST, 'to be defined');
      expect(process.env.TEST_ENVS__TEST, 'to equal', '13');
    });

    it('should set object options', function () {
      AtSCMCli.prototype._exposeOverride({ test: { another: 13 } }, 'test', 'TEST_ENVS__');

      expect(process.env.TEST_ENVS__TEST__ANOTHER, 'to be defined');
      expect(process.env.TEST_ENVS__TEST__ANOTHER, 'to equal', '13');
    });

    it('should use default base', function () {
      AtSCMCli.prototype._exposeOverride({ test: 13 }, 'test');

      expect(process.env.ATSCM_PROJECT__TEST, 'to be defined');
      expect(process.env.ATSCM_PROJECT__TEST, 'to equal', '13');

      delete process.env.ATSCM_PROJECT__TEST;
    });
  });

  /** @test {AtSCMCli#parseArguments} */
  describe('#parseArguments', function () {
    const unknownArgCli = new AtSCMCli(['config', '--unknown']);
    const unknownRunArgCli = new AtSCMCli(['run', '--unknown']);

    it('should fail with UsageError with an unknown argument', function () {
      return expect(unknownArgCli.parseArguments(), 'when rejected', 'to be a', UsageError);
    });

    it('should report unknown arguments for strict commands', function () {
      return expect(
        unknownArgCli.parseArguments(),
        'when rejected',
        'to have message',
        'Unknown argument: unknown'
      );
    });

    it('should not report unknown arguments for non-strict commands', function () {
      return expect(unknownRunArgCli.parseArguments(), 'when fulfilled', 'to have properties', {
        unknown: true,
      });
    });

    it('should return options with valid arguments', function () {
      return expect(
        new AtSCMCli(['docs', '--cli']).parseArguments(),
        'when fulfilled',
        'to have properties',
        { _: ['docs'], cli: true }
      );
    });

    it('should set AtSCMCli#options with valid arguments', function () {
      const cli = new AtSCMCli(['docs', '--cli']);

      return cli.parseArguments().then((opts) => expect(cli.options, 'to equal', opts));
    });

    it('should set AtSCMCli#command with valid command', function () {
      const cli = new AtSCMCli(['docs', '--cli']);

      return cli.parseArguments().then(() => expect(cli.command.name, 'to equal', 'docs'));
    });

    it('should expose project options as environment variables', function () {
      const cli = new AtSCMCli(['--tasks', '--project.test', 'test']);

      return cli
        .parseArguments()
        .then(() => expect(process.env.ATSCM_PROJECT__TEST, 'to equal', 'test'));
    });
  });

  /** @test {AtSCMCli#getEnvironment} */
  describe('#getEnvironment', function () {
    beforeEach(() => spy(Liftoff.prototype, 'launch'));
    afterEach(() => Liftoff.prototype.launch.restore());

    const cli = new AtSCMCli([
      '--cwd',
      'test/fixtures',
      '--projectfile',
      'test/fixtures/Atviseproject.js',
    ]);

    it('should call Liftoff#launch with cwd and projectfile option', function () {
      return cli.getEnvironment().then(() => {
        expect(Liftoff.prototype.launch.calledOnce, 'to be', true);
        expect(Liftoff.prototype.launch.lastCall.args[0], 'to equal', {
          cwd: 'test/fixtures',
          configPath: 'test/fixtures/Atviseproject.js',
        });
      });
    });

    it('should set AtSCMCli#environment', function () {
      return cli.getEnvironment().then((env) => {
        expect(cli.environment, 'to be defined');
        expect(cli.environment, 'to equal', env);
        expect(cli.environment, 'to have keys', [
          'cwd',
          'configPath',
          'configBase',
          'modulePath',
          'modulePackage',
        ]);
      });
    });

    context('when not looking up parent directories', function () {
      it('should resolve to initial cwd', function () {
        return new AtSCMCli()
          .getEnvironment(false)
          .then((env) => expect(env.cwd, 'to equal', process.cwd()));
      });

      const projChildDir = join('test/fixtures/node_modules');

      it('should resolve to initial cwd in project child directories', function () {
        return new AtSCMCli(['--cwd', projChildDir])
          .getEnvironment(false)
          .then((env) => expect(env.cwd, 'to end with', projChildDir));
      });

      it('should ignore --projectfile option', function () {
        return new AtSCMCli([
          '--cwd',
          projChildDir,
          '--projectfile',
          join(projChildDir, '../Atviseproject.js'),
        ])
          .getEnvironment(false)
          .then((env) => expect(env.cwd, 'to end with', projChildDir));
      });
    });
  });

  /** @test {AtSCMCli#requireEnvironment} */
  describe('#requireEnvironment', function () {
    it('should fail without local module', function () {
      return expect(
        new AtSCMCli().requireEnvironment(),
        'to be rejected with',
        /Local .* not found/
      );
    });

    it('should return environment if successful', function () {
      const cli = new AtSCMCli(['--cwd', 'test/fixtures']);

      return expect(
        cli.requireEnvironment(),
        'when fulfilled',
        'to have values satisfying',
        'not to be falsy'
      );
    });
  });

  /** @test {AtSCMCli#getVersion} */
  describe('#getVersion', function () {
    it('should return cli version without local module', function () {
      return expect(new AtSCMCli().getVersion(), 'when fulfilled', 'to equal', {
        cli: pkg.version,
        local: null,
      });
    });

    it('should even return cli version with invalid cwd', function () {
      return expect(
        new AtSCMCli(['--cwd', 'invalid/path']).getVersion(),
        'when fulfilled',
        'to equal',
        { cli: pkg.version, local: null }
      );
    });

    it('should return local version with local module', function () {
      return expect(new AtSCMCli(['--cwd', 'test/fixtures']).getVersion(), 'to be fulfilled with', {
        cli: pkg.version,
        local: 'latest',
      });
    });
  });

  /** @test {AtSCMCli#printVersion} */
  describe('#printVersion', function () {
    it('should print cli version only without local module', function () {
      return expect(new AtSCMCli().printVersion(), 'to be fulfilled').then(() => {
        expect(LoggerSpy.info.calledOnce, 'to be', true);
        expect(LoggerSpy.info.lastCall.args[0], 'to match', /CLI version/);
        expect(LoggerSpy.info.lastCall.args[1], 'to match', new RegExp(pkg.version));
      });
    });

    it('should print cli and local version with local module', function () {
      return expect(
        new AtSCMCli(['--cwd', 'test/fixtures']).printVersion(),
        'to be fulfilled'
      ).then(() => {
        expect(LoggerSpy.info.calledTwice, 'to be', true);
        expect(LoggerSpy.info.lastCall.args[0], 'to match', /Local version/);
        expect(LoggerSpy.info.lastCall.args[1], 'to match', /latest/);
      });
    });
  });

  /** @test {AtSCMCli#runCommand} */
  describe('#runCommand', function () {
    it('should print version if --version is used', function () {
      const cli = new AtSCMCli(['--version']);
      cli.options.version = true;

      spy(cli, 'printVersion');

      return cli.runCommand().then(() => {
        expect(cli.printVersion.calledOnce, 'to be', true);
      });
    });

    it('should run command if used', function () {
      const command = new Command('cmd', 'Just testing');
      stub(command, 'run');
      const cli = new AtSCMCli(['--cwd', 'test/fixtures']);
      cli.command = command;

      return cli.runCommand().then(() => {
        expect(command.run.calledOnce, 'to be true');
      });
    });

    it('should warn if no command is used', function () {
      const cli = new AtSCMCli(['--cwd', 'test/fixtures']);

      return cli.runCommand().then(() => {
        expect(LoggerSpy.warn.calledOnce, 'to be', true);
        expect(LoggerSpy.warn.lastCall.args[0], 'to contain', 'No command specified');
      });
    });
  });

  /** @test {AtSCMCli#launch} */
  describe('#launch', function () {
    it('should call AtSCMCli#parseArguments', function () {
      const cli = new AtSCMCli();
      spy(cli, 'parseArguments');
      stub(cli, 'runCommand').callsFake(() => Promise.resolve(true));

      return cli.launch().then(() => {
        expect(cli.runCommand.calledOnce, 'to be true');
        expect(cli.parseArguments.calledOnce, 'to be', true);
      });
    });

    it('should handle all exceptions if run via cli', function () {
      const cli = new AtSCMCli();
      cli.runViaCli = true;
      stub(cli, 'runCommand').callsFake(() => Promise.reject(new Error('test')));

      return expect(cli.launch(), 'to be fulfilled');
    });

    it('should report help on usage errors if run via cli', function () {
      const cli = new AtSCMCli(['--unknown']);
      cli.runViaCli = true;

      return expect(cli.launch(), 'to be fulfilled');
    });

    it('should start debug mode with `--debug` option', function () {
      const cli = new AtSCMCli(['--debug']);
      cli.runViaCli = true;

      return expect(cli.launch(), 'to be fulfilled').then(() =>
        expect(process.env.ATSCM_DEBUG, 'to equal', 'true')
      );
    });

    context('with ATSCM_DEBUG env var', function () {
      before(() => {
        process.env.ATSCM_DEBUG = 'yes';
      });
      after(() => {
        process.env.ATSCM_DEBUG = undefined;
      });

      it('should start debug mode', function () {
        const cli = new AtSCMCli(['--debug']);
        cli.runViaCli = true;

        return expect(cli.launch(), 'to be fulfilled').then(() =>
          expect(process.env.ATSCM_DEBUG, 'to equal', 'yes')
        );
      });
    });
  });
});
