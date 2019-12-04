import { join } from 'path';
import { resolve } from 'url';
import open from 'open';
import Command from '../../lib/cli/Command';
import CliOptions from '../Options';
import Logger from '../../lib/util/Logger';

/**
 * The command invoked when running "docs". Handles the options --cli and --browser.
 */
export default class DocsCommand extends Command {
  /**
   * Base URL of the hosted API documentation.
   * @type {string}
   */
  static get RemoteDocsBase() {
    return 'https://atscm.github.io/';
  }

  /**
   * Creates a new {@link DocsCommand} with the specified name and description.
   * @param {string} name The command's name.
   * @param {string} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        cli: CliOptions.cli,
        browser: CliOptions.browser,
        remote: CliOptions.remote,
      },
      maxArguments: 0,
    });
  }

  /**
   * Returns the path to the local api docs.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {string} The path to the local api docs.
   */
  localDocsPath(cli) {
    return join(
      cli.options.cli ? join(__dirname, '../../../') : join(cli.environment.modulePath, '../../'),
      'docs/api/index.html'
    );
  }

  /**
   * Returns the URL of the remote api docs.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {string} The URL of the remote api docs.
   */
  remoteDocsUrl(cli) {
    let path = cli.options.cli ? 'atscm-cli' : 'latest';

    if (cli.environment && cli.environment.modulePackage && cli.environment.modulePackage.version) {
      path = `from-cli/?version=${cli.environment.modulePackage.version}`;
    }

    return resolve(this.constructor.RemoteDocsBase, path);
  }

  /**
   * Returns the path or url to open. This is resolved in the following way:
   *  1. If `--remote` is passed, always return the URL of the hosted docs of atscm-cli or atscm
   *     based on the `--cli` option passed.
   *  2. If `--cli` is passed, always return the path to the local atscm-cli docs.
   *  3. Otherwise, check if a local module was found:
   *     - If *true* return the local module docs path,
   *     - else return the URL of the hosted atscm docs.
   * @param {AtSCMCli} cli The calling Cli instance.
   * @return {{address: string, isPath: boolean}} The resolved address and a flag indicating if the
   * address describes a file path.
   */
  addressToOpen(cli) {
    if (cli.options.remote !== true && (cli.options.cli || cli.environment.modulePath)) {
      return {
        address: this.localDocsPath(cli),
        isPath: true,
      };
    }

    return {
      address: this.remoteDocsUrl(cli),
      isPath: false,
    };
  }

  /**
   * Opens the requested docs in the requested browser.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {Promise} Resolved after the os-specific open command was started.
   */
  run(cli) {
    return (!cli.options.cli && !cli.environment ? cli.getEnvironment() : Promise.resolve())
      .then(() => this.addressToOpen(cli))
      .then(({ address, isPath }) => {
        Logger.debug('Opening', isPath ? Logger.format.path(address) : address);
        open(address, cli.options.browser ? { app: cli.options.browser } : undefined);
      });
  }

  /**
   * Returns `false` if the `--cli` option is used.
   * @param {AtSCMCli} cli The current cli instance.
   * @return {boolean} `false` if the `--cli` option is used.
   */
  requiresEnvironment(cli) {
    return cli.options.remote === false && !cli.options.cli;
  }
}
