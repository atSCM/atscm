import Command from '../../lib/cli/Command';

/**
 * The command invoked when running "config".
 */
export default class ConfigCommand extends Command {

  /**
   * Creates a new {@link ConfigCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      maxArguments: 0,
    });
  }

  /**
   * **Not implemented yet.
   */
  run() {
    throw new Error('Not implemented yet');
  }

}
