import { join } from 'path';
import open from 'open';
import Command from '../../lib/cli/Command';
import CliOptions from '../Options';

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
    open(this.pathToOpen(cli), cli.options.browser);
  }

  /**
   * Returns `true` if the `--cli` option is used.
   * @param {AtSCMCli} cli The current cli instance.
   */
  requiresEnvironment(cli) {
    return !cli.options.cli;
  }

}
