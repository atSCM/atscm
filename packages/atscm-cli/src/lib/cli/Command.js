/**
 * A command that can be run through the CLI.
 */
export default class Command {

  /**
   * Creates a new Command with the given name and options.
   * @param {String} name The command's name.
   * @param {function(cli: AtSCMCli): Promise} run The action the command should run.
   * @param {Object} options The options to apply.
   * @param {String} options.description The command's description.
   * @param {Map<String, Option>} options.options The options available for this command.
   * @param {String} [options.arguments] The command's argument string. See
   * [yargs' documentation](http://yargs.js.org/docs/#methods-commandmodule-positional-arguments)
   * for details.
   * @param {Number} [options.minArguments] The minimum number or (non-option) arguments the command
   * requires.
   * @param {Number} [options.maxArguments] The maximum number or (non-option) arguments the command
   * requires.
   * @throws {Error} Throws an error if options.description is not set.
   */
  constructor(name, run, options = {}) {
    /**
     * The command's name.
     * @type {String}
     */
    this.name = name;

    /**
     * The action the command should run.
     * @type {function(cli: AtSCMCli): Promise}
     */
    this.run = run;

    if (!options.description) {
      throw new Error('options.description is required');
    }

    if (options.minArguments && options.maxArguments !== undefined
      && options.maxArguments < options.minArguments) {
      throw new Error('options.maxArguments must not be less than options.minArguments');
    }

    /**
     * The command's raw options.
     * @type {Object}
     * @private
     */
    this._options = options;
  }

  /**
   * Returns the usage string for the command. Something like "{name} {arguments}".
   * @type {String}
   */
  get usage() {
    if (this._options.arguments) {
      return `${this.name} ${this._options.arguments}`;
    }

    return this.name;
  }

  /**
   * The options available for the command.
   * @type {Map<String, Option>}
   */
  get options() {
    return this._options.options || {};
  }

  /**
   * The minimum and maximum number of (non-option) arguments the command handles.
   * @type {Number[]}
   */
  get demandCommand() {
    const ret = [this._options.minArguments || 0];

    if (this._options.maxArguments !== undefined) {
      ret.push(this._options.maxArguments);
    }

    return ret;
  }

  /**
   * The command descriptions.
   * @type {String}
   */
  get description() {
    return this._options.description;
  }

}
