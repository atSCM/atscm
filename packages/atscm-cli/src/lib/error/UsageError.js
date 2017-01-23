/**
 * An error reported when {@link yargs} fails to parse arguments.
 */
export default class UsageError extends Error {

  /**
   * Creates a new {@link UsageError} based on an error message and the failing parser.
   * @param {String} message The error message.
   * @param {String} help Help text for the failing command.
   */
  constructor(message, help) {
    super(message);

    /**
     * Help text for the failing command.
     * @type {String}
     */
    this.help = help;
  }

}
