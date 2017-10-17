'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _url = require('url');

var _open = require('open');

var _open2 = _interopRequireDefault(_open);

var _Command = require('../../lib/cli/Command');

var _Command2 = _interopRequireDefault(_Command);

var _Options = require('../Options');

var _Options2 = _interopRequireDefault(_Options);

var _Logger = require('../../lib/util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The command invoked when running "docs". Handles the options --cli and --browser.
 */
class DocsCommand extends _Command2.default {

  /**
   * Base URL of the hosted API documentation.
   * @type {string}
   */
  static get RemoteDocsBase() {
    return 'https://doc.esdoc.org/github.com/atSCM/';
  }

  /**
   * Creates a new {@link DocsCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        cli: _Options2.default.cli,
        browser: _Options2.default.browser,
        remote: _Options2.default.remote
      },
      maxArguments: 0
    });
  }

  /**
   * Returns the path to the local api docs.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {string} The path to the local api docs.
   */
  localDocsPath(cli) {
    return (0, _path.join)(cli.options.cli ? (0, _path.join)(__dirname, '../../../') : (0, _path.join)(cli.environment.modulePath, '../../'), 'docs/api/index.html');
  }

  /**
   * Returns the URL of the remote api docs.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {string} The URL of the remote api docs.
   */
  remoteDocsUrl(cli) {
    return (0, _url.resolve)(this.constructor.RemoteDocsBase, cli.options.cli ? 'atscm-cli' : 'atscm');
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
        isPath: true
      };
    }

    return {
      address: this.remoteDocsUrl(cli),
      isPath: false
    };
  }

  /**
   * Opens the requested docs in the requested browser.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {Promise} Resolved after the os-specific open command was started.
   */
  run(cli) {
    return (!cli.options.cli && !cli.environment ? cli.getEnvironment() : Promise.resolve()).then(() => this.addressToOpen(cli)).then(({ address, isPath }) => {
      _Logger2.default.debug('Opening', isPath ? _Logger2.default.format.path(address) : address);
      (0, _open2.default)(address, cli.options.browser);
    });
  }

  /**
   * Returns `false` if the `--cli` option is used.
   * @param {AtSCMCli} cli The current cli instance.
   * @return {Boolean} `false` if the `--cli` option is used.
   */
  requiresEnvironment(cli) {
    return cli.options.remote === false && !cli.options.cli;
  }

}
exports.default = DocsCommand;
//# sourceMappingURL=Docs.js.map