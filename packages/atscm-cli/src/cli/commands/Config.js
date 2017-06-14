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
    process.env.ATSCM_CONFIG_PATH = cli.environment.configPath;

    // eslint-disable-next-line global-require
    const config = require(cli.environment.modulePath).ProjectConfig ||
      require(cli.environment.configPath).default; // eslint-disable-line global-require

    inspect.styles.number = 'magenta';
    inspect.styles.string = 'cyan';

    Logger.info(
      'Configuration at', Logger.format.path(cli.environment.configPath),
      `\n${inspect(config, { colors: true, depth: null, breakLength: 0 })}`
    );

    if (cli.options.project && config.name !== 'ProjectConfig') {
      Logger.warn('Overriding runtime configuration requires atscm version >= 0.4');
      Logger.info('Run', Logger.format.command('atscm update'), 'to update to the newest version');
    }
  }

}
