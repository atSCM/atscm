'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Run = require('./commands/Run');

var _Run2 = _interopRequireDefault(_Run);

var _Init = require('./commands/Init');

var _Init2 = _interopRequireDefault(_Init);

var _Config = require('./commands/Config');

var _Config2 = _interopRequireDefault(_Config);

var _Docs = require('./commands/Docs');

var _Docs2 = _interopRequireDefault(_Docs);

var _Update = require('./commands/Update');

var _Update2 = _interopRequireDefault(_Update);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * CLI commands available.
 * @type {Command[]}
 */
const Commands = [new _Run2.default('run', '(default) Run tasks.'), new _Init2.default('init', 'Create a new project.'), new _Config2.default('config', 'Validate and print config file.'), new _Docs2.default('docs', 'Open documentation.'), new _Update2.default('update', 'Update installed atscm module.')];

exports.default = Commands;
//# sourceMappingURL=Commands.js.map