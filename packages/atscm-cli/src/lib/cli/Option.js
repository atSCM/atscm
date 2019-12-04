/**
 * A command line option.
 */
export default class Option {
  /**
   * Creates a new {@link Option} based on a description and some options.
   * @param {string} desc A string describing the option. Used for help texts.
   * @param {Object} [options={}] The options to create the {@link Option} with. Refer to
   * yarg's documentation in order to know what options can be used here.
   * @see {@link yargs}
   */
  constructor(desc, options = {}) {
    /**
     * A string describing the option. Used for help texts.
     * @type {String}
     */
    this.desc = desc;

    Object.keys(options).forEach(k => (this[k] = options[k]));
  }

  /**
   * Shorthand to create an {@link Option} with type boolean.
   * @param {string} desc A string describing the option. Used for help texts.
   * @param {Object} [options={type: 'boolean'}] The options to create the {@link Option} with.
   * @return {Option} An {@link Option} with type boolean.
   */
  static boolean(desc, options = {}) {
    return new this(desc, Object.assign(options, { type: 'boolean' }));
  }

  /**
   * Shorthand to create an {@link Option} with type string.
   * @param {string} desc A string describing the option. Used for help texts.
   * @param {Object} [options={type: 'string', requiresArg: true}] The options to create the
   * {@link Option} with.
   * @return {Option} An {@link Option} with type string.
   */
  static string(desc, options = {}) {
    return new this(desc, Object.assign(options, { type: 'string', requiresArg: true }));
  }
}
