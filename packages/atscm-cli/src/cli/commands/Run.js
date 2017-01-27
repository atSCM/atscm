import Command from '../../lib/cli/Command';

/**
 * The command invoked when running "run".
 */
export default class RunCommand extends Command {

  /**
   * Creates a new {@link RunCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      arguments: '[tasks...]',
    });
  }

  /**
   * **Not implemented yet.**
   */
  run() {
    throw new Error('Not implemented yet');
  }

}
