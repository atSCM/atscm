import { join } from 'path';
import open from 'open';
import Command from '../../lib/cli/Command';
import CliOptions from '../Options';
import Logger from '../../lib/util/Logger';

/**
 * The command invoked when running "docs". Handles the options --cli and --browser.
 */
export default class DocsCommand extends Command {

  /**
   * Creates a new {@link DocsCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        cli: CliOptions.cli,
        browser: CliOptions.browser,
      },
      maxArguments: 0,
    });
  }

  /**
   * Returns the path to the api docs to open.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {String} The path to the api docs to opten.
   */
  pathToOpen(cli) {
    return join(
      cli.options.cli ?
        join(__dirname, '../../../') :
        join(cli.environment.modulePath, '../'),
      'docs/api/index.html'
    );
  }

  /**
   * Opens the requested docs in the requested browser.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    const docsPath = this.pathToOpen(cli);
    Logger.debug('Opening', Logger.format.path(docsPath));

    open(docsPath, cli.options.browser);
  }

  /**
   * Returns `false` if the `--cli` option is used.
   * @param {AtSCMCli} cli The current cli instance.
   * @return {Boolean} `false` if the `--cli` option is used.
   */
  requiresEnvironment(cli) {
    return !cli.options.cli;
  }

}
