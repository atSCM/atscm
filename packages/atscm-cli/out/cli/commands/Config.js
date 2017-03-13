'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _util = require('util');

var _Logger = require('../../lib/util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _Command = require('../../lib/cli/Command');

var _Command2 = _interopRequireDefault(_Command);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The command invoked when running "config".
 */
class ConfigCommand extends _Command2.default {

  /**
   * Creates a new {@link ConfigCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      maxArguments: 0
    });
  }

  /**
   * Prints the project's configuration.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    // eslint-disable-next-line global-require
    const config = require(cli.environment.configPath).default;

    _util.inspect.styles.number = 'magenta';
    _util.inspect.styles.string = 'cyan';

    _Logger2.default.info('Configuration at', _Logger2.default.format.path(cli.environment.configPath), `\n${ (0, _util.inspect)(config, { colors: true, depth: null, breakLength: 0 }) }`);
  }

}
exports.default = ConfigCommand;