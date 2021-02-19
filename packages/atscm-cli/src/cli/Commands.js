import RunCommand from './commands/Run';
import ConfigCommand from './commands/Config';
import DocsCommand from './commands/Docs';

/**
 * CLI commands available.
 * @type {Command[]}
 */
const Commands = [
  new RunCommand('run', '(default) Run tasks.'),
  new ConfigCommand('config', 'Validate and print config file.'),
  new DocsCommand('docs', 'Open documentation.'),
];

export default Commands;
