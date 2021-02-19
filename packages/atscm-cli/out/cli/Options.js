'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GlobalOptions = undefined;

var _Option = require('../lib/cli/Option');

var _Option2 = _interopRequireDefault(_Option);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
  browser: _Option2.default.string('Which browser to open in.'),
  cli: _Option2.default.boolean('Open CLI documentation.'),
  continue: _Option2.default.boolean('Continue execution of tasks upon failure.'),
  cwd: _Option2.default.string('Manually set the CWD.'),
  force: _Option2.default.boolean('Overwrite existing files.'),
  help: _Option2.default.boolean('Show this help.'),
  'log-level': new _Option2.default('Set the Logger level. ' + '-L for least verbose and -LLLL for most verbose. -LLL is default.', {
    alias: 'L',
    count: true,
    default: 3
  }),
  project: new _Option2.default('Override Atviseproject values.', { default: {} }),
  projectfile: _Option2.default.string('Manually set path of Atviseproject file to use. ' + 'This will set the CWD to the Atviseproject file\'s directory as well.', { alias: 'p' }),
  require: _Option2.default.string('Will require a module before running atscm.'),
  remote: _Option2.default.boolean('Open hosted documentation.', {
    default: undefined
  }),
  silent: _Option2.default.boolean('Suppress all logging.', { alias: 'S' }),
  tasks: _Option2.default.boolean('Print the task dependency tree.', {
    alias: 'T'
  }),
  'tasks-simple': _Option2.default.boolean('Print a plaintext list of tasks.'),
  'tasks-json': _Option2.default.boolean('Print the task dependency tree, in JSON format.'),
  version: _Option2.default.boolean('Print version.', { alias: 'v' }),
  beta: _Option2.default.boolean('Use atscm beta resources.')
};

exports.default = Options;

/**
 * Options that can be used globally.
 * @type {Map<String, Option>}
 */

const GlobalOptions = exports.GlobalOptions = {
  projectfile: Options.projectfile,
  cwd: Options.cwd,
  project: Options.project,
  require: Options.require,
  version: Options.version,
  help: Options.help,
  silent: Options.silent,
  beta: Options.beta,
  'log-level': Options['log-level']
};
//# sourceMappingURL=Options.js.map