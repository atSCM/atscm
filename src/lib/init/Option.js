/**
 * An option the "atscm init" command handles.
 * TODO: Support function values for name, message, default, choices...
 */
export default class InitOption {

  /**
   * Creates a new option based either on a message and (optionally) a default value or some
   * options.
   * @param {String|Object} messageOrOptions The message or options to use.
   * @param {Inquirer.PromptType} [messageOrOptions.type] The option's type.
   * @param {String} messageOrOptions.message The option's message. Required if `messageOrOptions`
   * is an object.
   * @param {String|Number} [messageOrOptions.default] The options's default value.
   * @param {Inquirer.Validator} [messageOrOptions.validate] A function that validates user input.
   * @param {String[]|Number[]} [messageOrOptions.choices] The options's choices. Applies to to list
   * types only.
   * @param {String|Number} [defaultOrUndefined] The default value to use.
   */
  constructor(messageOrOptions, defaultOrUndefined) {
    if (messageOrOptions === undefined) {
      throw new Error('message or options required');
    }

    if (typeof messageOrOptions === 'string') {
      if (messageOrOptions.length === 0) {
        throw new Error('message is required');
      }

      /**
       * The option's {@link Inquirer.PromptType}. Defaults to 'input'.
       * @type {Inquirer.PromptType}
       */
      this.type = InitOption.DefaultType;

      /**
       * The option's message. A '?' sign is added automatically.
       * @type {String}
       */
      this.message = `${messageOrOptions}?`;

      /**
       * The default value to use.
       * @type {String|Number|undefined}
       */
      this.default = defaultOrUndefined;
    } else {
      if (!messageOrOptions.message || messageOrOptions.length === 0) {
        throw new Error('message is required');
      }

      this.type = messageOrOptions.type || InitOption.DefaultType;
      this.message = `${messageOrOptions.message}?`;
      this.default = messageOrOptions.default;

      /**
       * The choices available. Applies to list types only.
       * @type {String[]|Number[]|undefined}
       */
      this.choices = messageOrOptions.choices;

      /**
       * Validates the user input for this option.
       * @type {Inquirer.Validator}
       */
      this.validate = messageOrOptions.validate;
    }
  }

  /**
   * The default {@link Inquirer.PromptType} to use. Equals 'input'.
   * @return {Inquirer.PromptType}
   */
  static get DefaultType() {
    return 'input';
  }

}
