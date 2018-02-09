/**
 * An option the 'atscm init' command handles.
 * TODO: Support function values for name, message, default, choices...
 */
export default class InitOption {

  /**
   * Creates a new option based either on a message and (optionally) a default value or some
   * options.
   * @param {String|Object} messageOrOptions The message or options to use.
   * @param {inquirer~PromptType} [messageOrOptions.type] The option's type.
   * @param {string} messageOrOptions.message The option's message. Required if `messageOrOptions`
   * is an object.
   * @param {String|Number} [messageOrOptions.default] The options's default value.
   * @param {inquirer~Validator} [messageOrOptions.validate] A function that validates user input.
   * @param {String[]|Number[]} [messageOrOptions.choices] The options's choices. Applies to to list
   * types only.
   * @param {Boolean|function(answers: Object): Boolean} [messageOrOptions.when] Weather or not to
   * prompt this option.
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
       * The option's {@link inquirer~PromptType}. Defaults to 'input'.
       * @type {inquirer~PromptType}
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
       * @type {inquirer~Validator}
       */
      this.validate = messageOrOptions.validate;

      /**
       * A function or boolean that indicates weather or not to prompt this option.
       * @type {Boolean|function(answers: Object): Boolean|undefined}
       */
      this.when = messageOrOptions.when;
    }
  }

  /**
   * The default {@link inquirer~PromptType} to use. Equals 'input'.
   * @return {inquirer~PromptType} The default {@link inquirer~PromptType} to use.
   */
  static get DefaultType() {
    return 'input';
  }

}
