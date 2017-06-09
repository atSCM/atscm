import RunCommand from './commands/Run';
import InitCommand from './commands/Init';
import ConfigCommand from './commands/Config';
import DocsCommand from './commands/Docs';
import UpdateCommand from './commands/Update';

/**
 * CLI commands available.
 * @type {Command[]}
 */
const Commands = [
  new RunCommand('run', '(default) Run tasks.'),
  new InitCommand('init', 'Create a new project.'),
  new ConfigCommand('config', 'Validate and print config file.'),
  new DocsCommand('docs', 'Open documentation.'),
  new UpdateCommand('update', 'Update installed atscm module.'),
];

export default Commands;
