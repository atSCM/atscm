import Option from '../lib/cli/Option';

/**
 * Command line options available.
 * @type {Object}
 * @property {Option} browser Which browser to open in.
 * @property {Option} cli Open CLI documentation.
 * @property {Option} config Print project configuration.
 * @property {Option} cwd Manually set the CWD.
 * @property {Option} force Overwrite existing files.
 * @property {Option} help Show help.
 * @property {Option} logLevel Set the Logger level.
 * @property {Option} projectfile Manually set path of Atviseproject file to use.
 * @property {Option} remote Open hosted documentation.
 * @property {Option} silent Supress all logging.
 * @property {Option} version Print version.
 * @property {Option} beta Use atscm beta resources.
 */
const Options = {
  browser: Option.string('Which browser to open in.'),
  cli: Option.boolean('Open CLI documentation.'),
  continue: Option.boolean('Continue execution of tasks upon failure.'),
  cwd: Option.string('Manually set the CWD.'),
  force: Option.boolean('Overwrite existing files.'),
  help: Option.boolean('Show this help.'),
  'log-level': new Option('Set the Logger level. ' +
    '-L for least verbose and -LLLL for most verbose. -LLL is default.', {
      alias: 'L',
      count: true,
      default: 3,
    }
  ),
  project: new Option('Override Atviseproject values.', { default: {} }),
  projectfile: Option.string('Manually set path of Atviseproject file to use. ' +
    'This will set the CWD to the Atviseproject file\'s directory as well.',
    { alias: 'p' }),
  require: Option.string('Will require a module before running atscm.'),
  remote: Option.boolean('Open hosted documentation.', {
    default: undefined,
  }),
  silent: Option.boolean('Suppress all logging.', { alias: 'S' }),
  tasks: Option.boolean('Print the task dependency tree.', {
    alias: 'T',
  }),
  'tasks-simple': Option.boolean('Print a plaintext list of tasks.'),
  'tasks-json': Option.boolean('Print the task dependency tree, in JSON format.'),
  version: Option.boolean('Print version.', { alias: 'v' }),
  beta: Option.boolean('Use atscm beta resources.'),
};

export default Options;

/**
 * Options that can be used globally.
 * @type {Map<String, Option>}
 */
export const GlobalOptions = {
  projectfile: Options.projectfile,
  cwd: Options.cwd,
  project: Options.project,
  require: Options.require,
  version: Options.version,
  help: Options.help,
  silent: Options.silent,
  'log-level': Options['log-level'],
};
