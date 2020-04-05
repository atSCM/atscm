import { realpathSync } from 'fs';
import { join } from 'path';
import { EOL } from 'os';
import Liftoff from 'liftoff';
import yargs from 'yargs';
import gulplog from 'gulplog';
import { jsVariants } from 'interpret';
import { yellow } from 'chalk';
import pkg from '../package.json';
import Logger from './lib/util/Logger';
import Options, { GlobalOptions } from './cli/Options';
import Commands from './cli/Commands';
import UsageError from './lib/error/UsageError';
import { readJson } from './lib/util/fs';

/**
 * The main class. Handles arguments and runs commands.
 * @extends {Liftoff}
 */
export default class AtSCMCli extends Liftoff {
  /**
   * The name under which the module is available from the command line.
   * @type {string}
   */
  static get BinName() {
    return Object.keys(pkg.bin)[0];
  }

  /**
   * The filename used for configuration files.
   * @type {string}
   */
  static get ConfigName() {
    return 'Atviseproject';
  }

  /**
   * Reports an error and exits the process with return code `1`.
   * @param {Error} err The error that occurred.
   */
  _reportCliError(err) {
    Logger.error(Logger.colors.red(err.message));

    if (err instanceof UsageError) {
      Logger.info(err.help);
    } else {
      Logger.debug(err.stack);

      if (err instanceof SyntaxError && this._failedRequires.length) {
        Logger.info(yellow(`You may have to install the '${this._failedRequires[0]}' module.`));
        Logger.info(['Other failed requires:', ...this._failedRequires].join(`${EOL} - `));
      }
    }

    process.exitCode = 1;
  }

  /**
   * Creates a new {@link AtSCMCli} object based on command line arguments.
   * @param {string[]} argv The command line arguments to use. If no command is provided and neither
   * `--help` nor `--version` are used, the command `run` is added.
   * @throws {UsageError} Throws an error if option parsing fails.
   */
  constructor(argv = []) {
    super({
      name: AtSCMCli.BinName,
      configName: AtSCMCli.ConfigName,
      extensions: jsVariants,
    });

    this.on('require', function (name) {
      Logger.debug('Requiring external module', Logger.colors.magenta(name));
    });

    /** If requiring an external module failed.
     * @type {string[]} */
    this._failedRequires = [];

    this.on('requireFail', function (name) {
      this._failedRequires.push(name);

      Logger.debug(
        Logger.colors.red('Failed to load external module'),
        Logger.colors.magenta(name)
      );
    });

    /**
     * `true` if the instance was created by running the binaries, `false` if used programmatically.
     * @type {Boolean}
     */
    this.runViaCli = realpathSync(process.argv[1]) === require.resolve('./bin/atscm');

    /**
     * The raw, unparsed command line arguments the Cli was created with.
     * @type {String[]}
     */
    this._argv = argv;

    // If no command is given, default to "run"
    const commandNames = Commands.map((c) => c.name);

    /**
     * The options parsed from {@link AtSCMCli#_argv}. Note that **these options are not complete**
     * until {@link AtSCMCli#launch} was called.
     * @type {Object}
     */
    this.options = yargs(argv)
      .version(false)
      .help(false)
      .env('ATSCM')
      .option(GlobalOptions)
      .fail((msg, e, y) => {
        const err = new UsageError(msg, y.help());

        if (this.runViaCli) {
          gulplog.on('error', () => {}); // Prevent logger to throw an error

          this._reportCliError(err);
        } else {
          throw err;
        }
      }).argv;

    if (!this.options.help && !this.options.version) {
      if (this.options._.filter((e) => commandNames.includes(e)).length === 0) {
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
    this.argumentsParser = Commands.reduce(
      (parser, command) =>
        parser.command(
          command.usage,
          command.description,
          (y) => {
            y.usage(`Usage: $0 ${command.usage}`);
            y.option(command.options);

            y.group(Object.keys(command.options), 'Command specific options:');
            y.group(globalOptionNames, 'Global options:');

            y.strict(command.strict);
            y.help('help', Options.help.desc).alias('help', 'h');
            y.demandCommand(...command.demandCommand);
          },
          () => (this.command = command)
        ),
      yargs()
        .env('ATSCM')
        .usage('Usage: $0 [cmd=run]')
        .version(false)
        .options(GlobalOptions)
        .global(globalOptionNames)
        .strict()
        .help('help', Options.help.desc)
        .alias('help', 'h')
    );
  }

  /**
   * Used to expose project config overrides via environment variables. All project options are
   * exposed as `ATSCM_PROJECT__{KEY}={VALUE}`.
   * @param {Object} config The object to expose.
   * @param {string} key The key currently handled.
   * @param {string} [base=ATSCM_PROJECT__] The parent key.
   */
  _exposeOverride(config, key, base = 'ATSCM_PROJECT__') {
    const currentKey = `${base}${key.toUpperCase()}`;

    if (typeof config[key] === 'object') {
      const c = config[key];

      Object.keys(c).forEach((k) => this._exposeOverride(c, k, `${currentKey}__`));
    } else {
      process.env[currentKey] = config[key];
      Logger.debug(`Setting ${currentKey}:`, Logger.format.value(config[key]));
    }
  }

  /**
   * Parses arguments and exposes the project options as environment variables.
   * @return {Promise<Object, UsageError>} Rejected with a {@link UsageError} if parsing failed,
   * otherwise fulfilled with the parsed arguments.
   */
  parseArguments() {
    return new Promise((resolve, reject) => {
      this.options = this.argumentsParser
        .fail((msg, err, y) => reject(new UsageError(msg, y.help())))
        .parse(this._argv);

      Object.keys(this.options.project).forEach((key) =>
        this._exposeOverride(this.options.project, key)
      );

      resolve(this.options);
    });
  }

  /**
   * Returns a {@link Liftoff.Environment} for the Cli.
   * @param {boolean} [findUp=false] If the environment should be searched for in parent
   * directories.
   * @return {Promise<Object>} Fulfilled with a {@link Liftoff} environment.
   */
  getEnvironment(findUp = true) {
    return new Promise((resolve) => {
      super.launch(
        {
          cwd: this.options.cwd,
          configPath: findUp
            ? this.options.projectfile
            : join(this.options.cwd || process.cwd(), `${this.constructor.ConfigName}.js`),
          require: this.options.require,
        },
        (env) => resolve((this.environment = env))
      );
    });
  }

  /**
   * Gets a {@link Liftoff.Environment} and validates a config file and a local module was found.
   * @return {Promise<Object, Error>} Resolved with the {@link Liftoff environment}, rejected if the
   * config file or the local module cannot be found.
   */
  requireEnvironment() {
    return this.getEnvironment().then((env) => {
      if (!env.modulePath) {
        throw new Error(`Local ${AtSCMCli.BinName} not found`);
      }

      if (!env.configPath) {
        throw new Error('No config file found');
      }

      return env;
    });
  }

  /**
   * Returns the CLI version and, if a local module could be found, the local version.
   * @return {Promise<{cli: string, local: ?string}>} Fulfilled with the found cli and local
   * version.
   */
  async getVersion() {
    const env = await this.getEnvironment();

    const projectPackage =
      env.modulePath && (await readJson(join(env.cwd, 'package.json')).catch(() => undefined));

    return {
      cli: pkg.version,
      local: env.modulePath ? env.modulePackage.version : undefined,
      server: projectPackage && projectPackage.engines && projectPackage.engines.atserver,
    };
  }

  /**
   * Gets and prints the CLI version and, if a local module could be found, the local version.
   * @return {Promise<{cli: string, local: ?string}>} Fulfilled with the found cli and local
   * version.
   */
  async printVersion() {
    const { cli, local, server } = await this.getVersion();

    const versions = [
      ['atscm-cli', cli],
      local && ['atscm', local],
      server && ['atvise server', server],
    ].filter((v) => v);

    const maxLength = versions.reduce((length, [label]) => Math.max(length, label.length), 0);

    versions.forEach(([label, version]) =>
      Logger.info(label.padEnd(maxLength + 1), Logger.format.number(version))
    );
  }

  /**
   * Runs the command specified in the command line arguments ({@link AtSCMCli#_argv}). **Note that
   * this will only work if {@link AtSCMCli#parseArguments} was called before.**.
   * @return {Promise<*, Error>} Fulfilled if the command succeeded.
   */
  runCommand() {
    if (this.options.version) {
      return this.printVersion();
    }

    if (this.command) {
      return (this.command.requiresEnvironment(this)
        ? this.requireEnvironment()
        : Promise.resolve()
      ).then(() => this.command.run(this));
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
      .then(() => {
        if (process.env.ATSCM_DEBUG || this.options.debug) {
          process.env.ATSCM_DEBUG = process.env.ATSCM_DEBUG || 'true';
          require('source-map-support').install(); // eslint-disable-line global-require
        }
      })
      .then(() => this.runCommand());

    if (this.runViaCli) {
      return app.catch((err) => this._reportCliError(err));
    }

    return app;
  }
}
