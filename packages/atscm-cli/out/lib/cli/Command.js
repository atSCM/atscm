'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * A command that can be run through the CLI.
 * @abstract
 */
class Command {

  /**
   * Creates a new Command with the given name and options.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   * @param {Object} options The options to apply.
   * @param {Map<String, Option>} options.options The options available for this command.
   * @param {String} [options.arguments] The command's argument string. See
   * [yargs' documentation](http://yargs.js.org/docs/#methods-commandmodule-positional-arguments)
   * for details.
   * @param {Number} [options.minArguments] The minimum number or (non-option) arguments the command
   * requires.
   * @param {Number} [options.maxArguments] The maximum number or (non-option) arguments the command
   * requires.
   * @throws {Error} Throws an error if options.maxArguments is less than options.minArguments.
   */
  constructor(name, description, options = {}) {
    /**
     * The command's name.
     * @type {String}
     */
    this.name = name;

    /**
     * The command descriptions.
     * @type {String}
     */
    this.description = description;

    if (options.minArguments && options.maxArguments !== undefined && options.maxArguments < options.minArguments) {
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
   * Runs the command with the current Cli instance. **Asynchronous commands should return a Promise
   * here.**
   * @param {AtSCMCli} cli The current cli instance.
   */
  run(cli) {
    // eslint-disable-line no-unused-vars
    throw new Error('Must be implemented by all subclasses');
  }

  /**
   * Returns `true` if the command requires a {@link Liftoff.Environment} before it can be run.
   * @param {AtSCMCli} cli The current cli instance.
   * @return {Boolean} `true` if the command requires a {@link Liftoff.Environment}.
   */
  requiresEnvironment(cli) {
    // eslint-disable-line no-unused-vars
    return true;
  }

  /**
   * Returns the usage string for the command. Something like "{name} {arguments}".
   * @type {String}
   */
  get usage() {
    if (this._options.arguments) {
      return `${ this.name } ${ this._options.arguments }`;
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

}
exports.default = Command;