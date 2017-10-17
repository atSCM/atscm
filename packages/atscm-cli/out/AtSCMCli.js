'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _path = require('path');

var _liftoff = require('liftoff');

var _liftoff2 = _interopRequireDefault(_liftoff);

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _interpret = require('interpret');

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

var _Logger = require('./lib/util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Options = require('./cli/Options');

var _Options2 = _interopRequireDefault(_Options);

var _Commands = require('./cli/Commands');

var _Commands2 = _interopRequireDefault(_Commands);

var _UsageError = require('./lib/error/UsageError');

var _UsageError2 = _interopRequireDefault(_UsageError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The main class. Handles arguments and runs commands.
 * @extends {Liftoff}
 */
class AtSCMCli extends _liftoff2.default {

  /**
   * The name under which the module is available from the command line.
   * @type {String}
   */
  static get BinName() {
    return Object.keys(_package2.default.bin)[0];
  }

  /**
   * The filename used for configuration files.
   * @type {String}
   */
  static get ConfigName() {
    return 'Atviseproject';
  }

  /**
   * Reports an error and exits the process with return code `1`.
   * @param {Error} err The error that occurred.
   */
  _reportCliError(err) {
    _Logger2.default.error(_Logger2.default.colors.red(err.message));

    if (err instanceof _UsageError2.default) {
      _Logger2.default.info(err.help);
    } else {
      _Logger2.default.debug(err.stack);
    }

    process.exitCode = 1;
  }

  /**
   * Creates a new {@link AtSCMCli} object based on command line arguments.
   * @param {String[]} argv The command line arguments to use. If no command is provided and neither
   * `--help` nor `--version` are used, the command `run` is added.
   * @throws {UsageError} Throws an error if option parsing fails.
   */
  constructor(argv = []) {
    super({
      name: AtSCMCli.BinName,
      configName: AtSCMCli.ConfigName,
      extensions: _interpret.jsVariants
    });

    this.on('require', function (name) {
      _Logger2.default.debug('Requiring external module', _Logger2.default.colors.magenta(name));
    });

    this.on('requireFail', function (name) {
      _Logger2.default.error(_Logger2.default.colors.red('Failed to load external module'), _Logger2.default.colors.magenta(name));
    });

    /**
     * `true` if the instance was created by running the binaries, `false` if used programmatically.
     * @type {Boolean}
     */
    this.runViaCli = (0, _fs.realpathSync)(process.argv[1]) === require.resolve('./bin/atscm');

    /**
     * The raw, unparsed command line arguments the Cli was created with.
     * @type {String[]}
     */
    this._argv = argv;

    // If no command is given, default to "run"
    const commandNames = _Commands2.default.map(c => c.name);

    /**
     * The options parsed from {@link AtSCMCli#_argv}. Note that **these options are not complete**
     * until {@link AtSCMCli#launch} was called.
     * @type {Object}
     */
    this.options = (0, _yargs2.default)(argv).env('ATSCM').option(_Options.GlobalOptions).fail((msg, e, y) => {
      const err = new _UsageError2.default(msg, y.help());

      if (this.runViaCli) {
        _gulplog2.default.on('error', () => {}); // Prevent logger to throw an error

        this._reportCliError(err);
      } else {
        throw err;
      }
    }).argv;

    if (!this.options.help && !this.options.version) {
      if (this.options._.filter(e => commandNames.includes(e)).length === 0) {
        this._argv.unshift('run');
      }
    }

    // Initialize logger
    _Logger2.default.applyOptions(this.options);

    const globalOptionNames = Object.keys(_Options.GlobalOptions);

    /**
     * An instance of {@link yargs} responible for parsing options.
     * @type {yargs}
     */
    this.argumentsParser = _Commands2.default.reduce((parser, command) => parser.command(command.usage, command.description, y => {
      y.usage(`Usage: $0 ${command.usage}`);
      y.option(command.options);

      y.group(Object.keys(command.options), 'Command specific options:');
      y.group(globalOptionNames, 'Global options:');

      y.strict();
      y.help('help', _Options2.default.help.desc);
      y.demandCommand(...command.demandCommand);
    }, () => this.command = command), (0, _yargs2.default)().env('ATSCM').usage('Usage: $0 [cmd=run]').options(_Options.GlobalOptions).global(globalOptionNames).strict().help('help', _Options2.default.help.desc).alias('help', 'h'));
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

      Object.keys(c).forEach(k => this._exposeOverride(c, k, `${currentKey}__`));
    } else {
      process.env[currentKey] = config[key];
      _Logger2.default.debug(`Setting ${currentKey}:`, _Logger2.default.format.value(config[key]));
    }
  }

  /**
   * Parses arguments and exposes the project options as environment variables.
   * @return {Promise<Object, UsageError>} Rejected with a {@link UsageError} if parsing failed,
   * otherwise fulfilled with the parsed arguments.
   */
  parseArguments() {
    return new Promise((resolve, reject) => {
      this.options = this.argumentsParser.fail((msg, err, y) => reject(new _UsageError2.default(msg, y.help()))).parse(this._argv);

      Object.keys(this.options.project).forEach(key => this._exposeOverride(this.options.project, key));

      resolve(this.options);
    });
  }

  /**
   * Returns a {@link Liftoff.Environment} for the Cli.
   * @param {Boolean} [findUp=false] If the environment should be searched for in parent
   * directories.
   * @return {Promise<Object>} Fulfilled with a {@link Liftoff} environment.
   */
  getEnvironment(findUp = true) {
    return new Promise(resolve => {
      super.launch({
        cwd: this.options.cwd,
        configPath: findUp ? this.options.projectfile : (0, _path.join)(this.options.cwd || process.cwd(), `${this.constructor.ConfigName}.js`),
        require: this.options.require
      }, env => resolve(this.environment = env));
    });
  }

  /**
   * Gets a {@link Liftoff.Environment} and validates a config file and a local module was found.
   * @return {Promise<Object, Error>} Resolved with the {@link Liftoff environment}, rejected if the
   * config file or the local module cannot be found.
   */
  requireEnvironment() {
    return this.getEnvironment().then(env => {
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
   * @return {Promise<{cli: String, local: ?String}>} Fulfilled with the found cli and local
   * version.
   */
  getVersion() {
    return this.getEnvironment().then(env => ({
      cli: _package2.default.version,
      local: env.modulePath ? env.modulePackage.version : null
    }));
  }

  /**
   * Gets and prints the CLI version and, if a local module could be found, the local version.
   * @return {Promise<{cli: String, local: ?String}>} Fulfilled with the found cli and local
   * version.
   */
  printVersion() {
    return this.getVersion().then(version => {
      _Logger2.default.info('CLI version', _Logger2.default.format.number(version.cli));

      if (version.local) {
        _Logger2.default.info('Local version', _Logger2.default.format.number(version.local));
      }

      return version;
    });
  }

  /**
   * Runs the command specified in the command line arguments ({@link AtSCMCli#_argv}). **Note that
   * this will only work if {@link AtSCMCli#parseArguments} was called before.**
   * @return {Promise<*, Error>} Fulfilled if the command succeeded.
   */
  runCommand() {
    if (this.options.version) {
      return this.printVersion();
    }

    if (this.command) {
      return (this.command.requiresEnvironment(this) ? this.requireEnvironment() : Promise.resolve()).then(() => this.command.run(this));
    }

    _Logger2.default.warn('No command specified');

    return Promise.resolve(this);
  }

  /**
   * Parses arguments and runs the specified command.
   * @return {Promise<*, Error>} Fulfilled if the command succeeded. Note that, if the instance is
   * run through the binary all rejections will be handled.
   */
  launch() {
    const app = this.parseArguments().then(() => this.runCommand());

    if (this.runViaCli) {
      return app.catch(err => this._reportCliError(err));
    }

    return app;
  }

}
exports.default = AtSCMCli;
//# sourceMappingURL=AtSCMCli.js.map