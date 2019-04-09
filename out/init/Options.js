"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.InitOptions = exports.ConfigLangs = void 0;

var _path = require("path");

var _Option = _interopRequireDefault(require("../lib/init/Option"));

var _Atviseproject = _interopRequireDefault(require("../lib/config/Atviseproject"));

var _OptionsValidator = _interopRequireDefault(require("./OptionsValidator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A map providing dirnames for config langs
 * @type {Map<String, String>}
 */
const ConfigLangs = {
  'ES2015 JavaScript': 'es2015',
  'Regular JavaScript': 'es5',
  TypeScript: 'ts',
  'CoffeeScript (alpha)': 'coffee'
};
/**
 * Suggests a project name based on the name of the directory 'atscm init' was called in.
 * @param {string} dirname The current working directory's name.
 * @return {string} The suggested name.
 */

exports.ConfigLangs = ConfigLangs;

function projectName(dirname) {
  if (dirname === 'atscm') {
    return 'atscm-project';
  }

  return dirname;
}
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


const InitOptions = {
  name: new _Option.default({
    message: 'Project name',
    default: projectName((0, _path.basename)(process.cwd())),
    validate: _OptionsValidator.default.name
  }),
  description: new _Option.default('Project description'),
  author: new _Option.default('Project author'),
  atviseHost: new _Option.default('Atvise server host', _Atviseproject.default.host),
  atvisePortOpc: new _Option.default('Atvise OPC port', _Atviseproject.default.port.opc),
  atvisePortHttp: new _Option.default('Atvise HTTP port', _Atviseproject.default.port.http),
  useLogin: new _Option.default({
    message: 'Does your atvise server require login',
    type: 'confirm',
    default: false
  }),
  atviseUser: new _Option.default({
    message: ' - Username',
    when: answers => answers.useLogin
  }),
  atvisePassword: new _Option.default({
    message: ' - Password',
    when: answers => answers.useLogin
  }),
  configLang: new _Option.default({
    type: 'list',
    message: 'Configuration language to use',
    choices: Object.keys(ConfigLangs).map(name => ({
      name,
      value: ConfigLangs[name]
    }))
  })
};
/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */

exports.InitOptions = InitOptions;
const InitOptionsAsArray = Object.keys(InitOptions).map(name => Object.assign({
  name
}, InitOptions[name]));
var _default = InitOptionsAsArray;
exports.default = _default;
//# sourceMappingURL=Options.js.map