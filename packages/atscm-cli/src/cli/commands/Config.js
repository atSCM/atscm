import { inspect } from 'util';
import Logger from '../../lib/util/Logger';
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
   * Prints the project's configuration.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    const config = require(cli.environment.configPath).default;

    Logger.info(
      'Configuration at', Logger.format.path(cli.environment.configPath),
      `\n${inspect(config, { colors: true, depth: null })}`
    );
  }

}
