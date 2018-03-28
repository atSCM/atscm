'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InitOptions = exports.ConfigLangs = undefined;

var _path = require('path');

var _Option = require('../lib/init/Option');

var _Option2 = _interopRequireDefault(_Option);

var _Atviseproject = require('../lib/config/Atviseproject');

var _Atviseproject2 = _interopRequireDefault(_Atviseproject);

var _OptionsValidator = require('./OptionsValidator');

var _OptionsValidator2 = _interopRequireDefault(_OptionsValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A map providing dirnames for config langs
 * @type {Map<String, String>}
 */
const ConfigLangs = exports.ConfigLangs = {
  'ES2015 JavaScript': 'es2015',
  'Regular JavaScript': 'es5',
  TypeScript: 'ts',
  'CoffeeScript (alpha)': 'coffee'
};

/**
 * Options available for the "atscm init" command.
 * @type {Object}
 * @property {InitOption<input>} name The new project's name.
 * @property {InitOption<input>} description The new project's description.
 * @property {InitOption<input>} author The new project's author.
 * @property {InitOption<input>} atviseHost The new project's atvise server host.
 * @property {InitOption<input>} atvisePortOpc The new project's atvise server OPC port.
 * @property {InitOption<input>} atvisePortHttp The new project's atvise server HTTP port.
 * @property {InitOption<confirm>} useLogin If the new porject's atvise server requires login.
 * @property {InitOption<input>} atviseUsername The new project's atvise server login name.
 * @property {InitOption<input>} atvisePassword The new project's atvise server login password.
 * @property {InitOption<list>} configLang The language to use for the new project's configuration.
 */
const InitOptions = exports.InitOptions = {
  name: new _Option2.default({
    message: 'Project name',
    default: (0, _path.basename)(process.cwd()),
    validate: _OptionsValidator2.default.name
  }),
  description: new _Option2.default('Project description'),
  author: new _Option2.default('Project author'),
  atviseHost: new _Option2.default('Atvise server host', _Atviseproject2.default.host),
  atvisePortOpc: new _Option2.default('Atvise OPC port', _Atviseproject2.default.port.opc),
  atvisePortHttp: new _Option2.default('Atvise HTTP port', _Atviseproject2.default.port.http),
  useLogin: new _Option2.default({
    message: 'Does your atvise server require login',
    type: 'confirm',
    default: false
  }),
  atviseUser: new _Option2.default({
    message: ' - Username',
    when: answers => answers.useLogin
  }),
  atvisePassword: new _Option2.default({
    message: ' - Password',
    when: answers => answers.useLogin
  }),
  configLang: new _Option2.default({
    type: 'list',
    message: 'Configuration language to use',
    choices: Object.keys(ConfigLangs).map(name => ({ name, value: ConfigLangs[name] }))
  })
};

/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */
const InitOptionsAsArray = Object.keys(InitOptions).map(name => Object.assign({ name }, InitOptions[name]));

exports.default = InitOptionsAsArray;
//# sourceMappingURL=Options.js.map