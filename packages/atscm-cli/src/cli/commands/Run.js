import { join } from 'path';
import colors from 'chalk';
import Command from '../../lib/cli/Command';
import CliOptions from '../Options';

/**
 * The command invoked when running "run".
 */
export default class RunCommand extends Command {

  /**
   * Creates a new {@link RunCommand} with the specified name and description.
   * @param {string} name The command's name.
   * @param {string} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      arguments: '[task...]',
      options: {
        tasks: CliOptions.tasks,
        'tasks-simple': CliOptions['tasks-simple'],
        'tasks-json': CliOptions['tasks-json'],
        continue: CliOptions.continue,
      },
    });
  }

  /**
   * Runs gulp with the specified tasks.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    const opts = {
      _: cli.options.task,
      tasks: cli.options.T,
      tasksSimple: cli.options.tasksSimple,
      tasksJson: cli.options.tasksJson,
      continue: cli.options.continue,
    };

    process.env.ATSCM_CONFIG_PATH = cli.environment.configPath;

    // eslint-disable-next-line global-require
    require('gulp-cli/lib/versioned/^4.0.0/')(
      opts,
      {
        configPath: join(cli.environment.modulePath, '../Gulpfile.js'),
        modulePath: join(cli.environment.cwd, 'node_modules/gulp'),
      }, {
        description: colors.bold('Available tasks:'),
      });
  }

}
