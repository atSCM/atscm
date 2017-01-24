import DocsCommand from './commands/Docs';
import RunCommand from './commands/Run';
import ConfigCommand from './commands/Config';

/**
 * CLI commands available.
 * @type {Command[]}
 */
const Commands = [
  new RunCommand('run', '(default) Run tasks.'),
  new DocsCommand('docs', 'Open documentation.'),
  new ConfigCommand('config', 'Validate and print config file.'),
];

export default Commands;
