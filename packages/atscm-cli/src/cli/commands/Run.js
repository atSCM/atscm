import { join } from 'path';
import Command from '../../lib/cli/Command';
import CliOptions from '../Options';

/**
 * The command invoked when running "run".
 */
export default class RunCommand extends Command {

  /**
   * Creates a new {@link RunCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      arguments: '[tasks...]',
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
      _: cli.options.tasks,
      tasks: cli.options.T,
      tasksSimple: cli.options.tasksSimple,
      tasksJson: cli.options.tasksJson,
      continue: cli.options.continue,
    };

    // eslint-disable-next-line global-require
    require('gulp-cli/lib/versioned/^4.0.0-alpha.2/')(
      opts,
      {
        configPath: join(cli.environment.modulePath, '../Gulpfile.js'),
        modulePath: join(cli.environment.cwd, 'node_modules/gulp'),
      });
  }

}
