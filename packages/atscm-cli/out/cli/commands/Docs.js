'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

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
   * Creates a new {@link DocsCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        cli: _Options2.default.cli,
        browser: _Options2.default.browser
      },
      maxArguments: 0
    });
  }

  /**
   * Returns the path to the api docs to open.
   * @param {AtSCMCli} cli The current Cli instance.
   * @return {String} The path to the api docs to opten.
   */
  pathToOpen(cli) {
    return (0, _path.join)(cli.options.cli ? (0, _path.join)(__dirname, '../../../') : (0, _path.join)(cli.environment.modulePath, '../../'), 'docs/api/index.html');
  }

  /**
   * Opens the requested docs in the requested browser.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    const docsPath = this.pathToOpen(cli);
    _Logger2.default.debug('Opening', _Logger2.default.format.path(docsPath));

    (0, _open2.default)(docsPath, cli.options.browser);
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
exports.default = DocsCommand;