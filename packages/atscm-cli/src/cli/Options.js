import Option from '../lib/cli/Option';

/**
 * Command line options available.
 * @type {Object}
 * @property {Option} browser Which browser to open in.
 * @property {Option} cli Open CLI documentation.
 * @property {Option} config Print project configuration.
 * @property {Option} cwd Manually set the CWD.
 * @property {Option} help Show help.
 * @property {Option} logLevel Set the Logger level.
 * @property {Option} projectfile Manually set path of Atviseproject file to use.
 * @property {Option} silent Supress all logging.
 * @property {Option} version Print version.
 */
const Options = {
  browser: Option.string('Which browser to open in.'),
  cli: Option.boolean('Open CLI documentation.'),
  cwd: Option.string('Manually set the CWD.'),
  help: Option.boolean('Show this help.'),
  'log-level': new Option('Set the Logger level. ' +
    '-L for least verbose and -LLLL for most verbose. -LLL is default.', {
      alias: 'L',
      count: true,
      default: 3,
    }
  ),
  projectfile: Option.string('Manually set path of Atviseproject file to use. ' +
    'This will set the CWD to the Atviseproject file\'s directory as well.',
    { alias: 'p' }),
  silent: Option.boolean('Suppress all logging.', { alias: 'S' }),
  version: Option.boolean('Print version.', { alias: 'v' }),
};

export default Options;

/**
 * Options that can be used globally.
 * @type {Map<String, Option>}
 */
export const GlobalOptions = {
  projectfile: Options.projectfile,
  cwd: Options.cwd,
  version: Options.version,
  help: Options.help,
  silent: Options.silent,
  'log-level': Options['log-level'],
};
