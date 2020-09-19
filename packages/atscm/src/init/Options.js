import { basename } from 'path';
import InitOption from '../lib/init/Option';
import Atviseproject from '../lib/config/Atviseproject';
import Validator from './OptionsValidator';

/**
 * A map providing dirnames for config langs
 * @type {Map<String, String>}
 */
export const ConfigLangs = {
  'ES2015 JavaScript': 'es2015',
  'Regular JavaScript': 'es5',
  TypeScript: 'ts',
};

/**
 * Suggests a project name based on the name of the directory 'atscm init' was called in.
 * @param {string} dirname The current working directory's name.
 * @return {string} The suggested name.
 */
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
export const InitOptions = {
  name: new InitOption({
    message: 'Project name',
    default: projectName(basename(process.cwd())),
    validate: Validator.name,
  }),
  description: new InitOption('Project description'),
  author: new InitOption('Project author'),
  atviseHost: new InitOption('Atvise server host', Atviseproject.host),
  atvisePortOpc: new InitOption('Atvise OPC port', Atviseproject.port.opc),
  atvisePortHttp: new InitOption('Atvise HTTP port', Atviseproject.port.http),
  useLogin: new InitOption({
    message: 'Does your atvise server require login',
    type: 'confirm',
    default: false,
  }),
  atviseUser: new InitOption({
    message: ' - Username',
    when: (answers) => answers.useLogin,
  }),
  atvisePassword: new InitOption({
    message: ' - Password',
    when: (answers) => answers.useLogin,
  }),
  configLang: new InitOption({
    type: 'list',
    message: 'Configuration language to use',
    choices: Object.keys(ConfigLangs).map((name) => ({ name, value: ConfigLangs[name] })),
  }),
};

/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */
const InitOptionsAsArray = Object.keys(InitOptions).map((name) =>
  Object.assign({ name }, InitOptions[name])
);

export default InitOptionsAsArray;
