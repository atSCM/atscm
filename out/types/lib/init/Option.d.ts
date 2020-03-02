/**
 * An option the "atscm init" command handles.
 * TODO: Support function values for name, message, default, choices...
 */
export default class InitOption {
    /**
     * The default {@link inquirer~PromptType} to use. Equals 'input'.
     * @return {inquirer~PromptType} The default {@link inquirer~PromptType} to use.
     */
    static get DefaultType(): string;
    /**
     * Creates a new option based either on a message and (optionally) a default value or some
     * options.
     * @param {string|Object} messageOrOptions The message or options to use.
     * @param {inquirer~PromptType} [messageOrOptions.type] The option's type.
     * @param {string} messageOrOptions.message The option's message. Required if `messageOrOptions`
     * is an object.
     * @param {string|number} [messageOrOptions.default] The options's default value.
     * @param {inquirer~Validator} [messageOrOptions.validate] A function that validates user input.
     * @param {string[]|number[]} [messageOrOptions.choices] The options's choices. Applies to to list
     * types only.
     * @param {boolean|function(answers: Object): boolean} [messageOrOptions.when] Weather or not to
     * prompt this option.
     * @param {string|number} [defaultOrUndefined] The default value to use.
     */
    constructor(messageOrOptions: any, defaultOrUndefined?: string | number);
    /**
     * The option's {@link inquirer~PromptType}. Defaults to 'input'.
     * @type {inquirer~PromptType}
     */
    type: inquirer;
    /**
     * The option's message. A '?' sign is added automatically.
     * @type {String}
     */
    message: String;
    /**
     * The default value to use.
     * @type {String|Number|undefined}
     */
    default: String | Number | undefined;
    /**
     * The choices available. Applies to list types only.
     * @type {String[]|Number[]|undefined}
     */
    choices: String[] | Number[] | undefined;
    /**
     * Validates the user input for this option.
     * @type {inquirer~Validator}
     */
    validate: inquirer;
    /**
     * A function or boolean that indicates weather or not to prompt this option.
     * @type {Boolean|function(answers: Object): Boolean|undefined}
     */
    when: Boolean | ((arg0: answers, arg1: Object) => Boolean | undefined);
}
