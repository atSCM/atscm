import { realpathSync } from 'fs';
import Liftoff from 'liftoff';
import yargs from 'yargs';
import pkg from '../package.json';
import Logger from './lib/util/Logger';
import Options, { GlobalOptions } from './cli/Options';
import Commands from './cli/Commands';
import UsageError from './lib/error/UsageError';

/**
 * The main class. Handles arguments and runs commands.
 * @extends {Liftoff}
 */
export default class AtSCMCli extends Liftoff {

  /**
   * The name under which the module is available from the command line.
   * @type {String}
   */
  static get BinName() {
    return Object.keys(pkg.bin)[0];
  }

  /**
   * The filename used for configuration files.
   * @type {String}
   */
  static get ConfigName() {
    return 'Atviseproject';
  }

  /**
   * Creates a new {@link AtSCMCli} object based on command line arguments.
   * @param {String[]} argv The command line arguments to use. If no command is provided and neither
   * `--help` nor `--version` are used, the command `run` is added.
   */
  constructor(argv = []) {
    super({
      name: AtSCMCli.BinName,
      configName: AtSCMCli.ConfigName,
    });

    /**
     * The raw, unparsed command line arguments the Cli was created with.
     * @type {String[]}
     */
    this._argv = argv;

    // If no command is given, default to "run"
    const commandNames = Commands.map(c => c.name);

    /**
     * The options parsed from {@link AtSCMCli#_argv}. Note that **these options are not complete**
     * until {@link AtSCMCli#lauch} was called.
     * @type {Object}
     */
    this.options = yargs(argv).option(GlobalOptions).argv;

    if (!this.options.help && !this.options.version) {
      if (this.options._.filter(e => commandNames.includes(e)).length === 0) {
        this._argv.unshift('run');
      }
    }

    // Initialize logger
    Logger.applyOptions(this.options);

    const globalOptionNames = Object.keys(GlobalOptions);

    /**
     * An instance of {@link yargs} responible for parsing options.
     * @type {yargs}
     */
    this.argumentsParser = Commands
      .reduce(
        (parser, command) => parser
          .command(command.usage, command.description, y => {
            y.usage(`Usage: $0 ${command.usage}`);
            y.option(command.options);

            y.group(Object.keys(command.options), 'Command specific options:');
            y.group(globalOptionNames, 'Global options:');

            y.strict();
            y.help('help', Options.help.desc);
            y.demandCommand(...command.demandCommand);
          }, () => (this.command = command)),
        yargs()
          .usage('Usage: $0 [cmd=run]')
          .options(GlobalOptions)
          .global(globalOptionNames)
          .strict()
          .help('help', Options.help.desc)
          .alias('help', 'h')
      );

    /**
     * `true` if the instance was created by running the binaries, `false` if used programmatically.
     * @type {Boolean}
     */
    this.runViaCli = realpathSync(process.argv[1]) === require.resolve('./bin/atscm');
  }

  /**
   * Parses arguments.
   * @return {Promise<Object, UsageError>} Rejected with a {@link UsageError} if parsing failed,
   * otherwise fulfilled with the parsed arguments.
   */
  parseArguments() {
    return new Promise((resolve, reject) => {
      this.options = this.argumentsParser
        .fail((msg, err, y) => reject(new UsageError(msg, y.help())))
        .parse(this._argv);

      resolve(this.options);
    });
  }

  /**
   * Returns a {@link Liftoff.Environment} for the Cli.
   * @return {Promise<Object>} Fulfilled with a {@link Liftoff} environment.
   */
  getEnvironment() {
    return new Promise(resolve => {
      super.launch({
        cwd: this.options.cwd,
        configPath: this.options.projectfile,
      }, env => resolve(this.environment = env));
    });
  }

  /**
   * Gets a {@link Liftoff.Environment} and validates a config file and a local module was found.
   * @return {Promise<Object, Error>} Resolved with the {@link Liftoff environment}, rejected if the
   * config file or the local module cannot be found.
   */
  requireEnvironment() {
    return this.getEnvironment()
      .then(env => {
        if (!env.modulePath || !env.configPath) {
          throw new Error(`Local ${AtSCMCli.BinName} not found`);
        }

        if (env.cwd !== process.cwd()) {
          // FIXME: call process.chdir here.
          Logger.info('Changing CWD to', Logger.format.path(env.cwd));
        }

        return env;
      });
  }

  /**
   * Returns the CLI version and, if a local module could be found, the local version.
   * @return {Promise<{cli: String, local: ?String}>} Fulfilled with the found cli and local
   * version.
   */
  getVersion() {
    return this.getEnvironment()
      .then(env => ({
        cli: pkg.version,
        local: env.modulePath ? env.modulePackage.version : null,
      }));
  }

  /**
   * Gets and prints the CLI version and, if a local module could be found, the local version.
   * @return {Promise<{cli: String, local: ?String}>} Fulfilled with the found cli and local
   * version.
   */
  printVersion() {
    return this.getVersion()
      .then(version => {
        Logger.info('CLI version', Logger.format.number(version.cli));

        if (version.local) {
          Logger.info('Local version', Logger.format.number(version.local));
        }

        return version;
      });
  }

  /**
   * Runs the command specified in the command line arguments ({@link AtSCMCli#_argv}). **Note that
   * this will only work if {@link AtSCMCli#parseArguments} was called before!**
   * @return {Promise<*, Error>} Fullfilled if the command succeeded.
   */
  runCommand() {
    if (this.options.version) {
      return this.printVersion();
    }

    if (this.command) {
      return this.requireEnvironment()
        .then(() => this.command.run(this));
    }

    Logger.warn('No command specified');

    return Promise.resolve(this);
  }

  /**
   * Parses arguments and runs the specified command.
   * @return {Promise<*, Error>} Fulfilled if the command succeeded. Note that, if the instance is
   * run through the binary all rejections will be handled.
   */
  launch() {
    const app = this.parseArguments()
      .then(() => this.runCommand());

    if (this.runViaCli) {
      return app
        .catch(err => {
          Logger.error(Logger.colors.red(err.message));

          if (err instanceof UsageError) {
            Logger.info(err.help);
          } else {
            Logger.debug(err.stack);
          }

          process.exitCode = 1;
        });
    }

    return app;
  }

}
