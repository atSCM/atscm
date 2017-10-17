'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _Command = require('../../lib/cli/Command');

var _Command2 = _interopRequireDefault(_Command);

var _Options = require('../Options');

var _Options2 = _interopRequireDefault(_Options);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The command invoked when running "run".
 */
class RunCommand extends _Command2.default {

  /**
   * Creates a new {@link RunCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      arguments: '[tasks...]',
      options: {
        tasks: _Options2.default.tasks,
        'tasks-simple': _Options2.default['tasks-simple'],
        'tasks-json': _Options2.default['tasks-json'],
        continue: _Options2.default.continue
      }
    });
  }

  /**
   * Runs gulp with the specified tasks.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    const opts = {
      _: cli.options.tasks,
      tasks: cli.options.T,
      tasksSimple: cli.options.tasksSimple,
      tasksJson: cli.options.tasksJson,
      continue: cli.options.continue
    };

    process.env.ATSCM_CONFIG_PATH = cli.environment.configPath;

    // eslint-disable-next-line global-require
    require('gulp-cli/lib/versioned/^4.0.0-alpha.2/')(opts, {
      configPath: (0, _path.join)(cli.environment.modulePath, '../Gulpfile.js'),
      modulePath: (0, _path.join)(cli.environment.cwd, 'node_modules/gulp')
    }, {
      description: _chalk2.default.bold('Available tasks:')
    });
  }

}
exports.default = RunCommand;
//# sourceMappingURL=Run.js.map