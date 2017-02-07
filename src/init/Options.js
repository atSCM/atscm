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
  'CoffeeScript (alpha)': 'coffee',
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
 * @property {InitOption<list>} configLang The language to use for the new project's configuration.
 */
export const InitOptions = {
  name: new InitOption({
    message: 'Project name',
    default: basename(process.cwd()),
    validate: Validator.name,
  }),
  description: new InitOption('Project description'),
  author: new InitOption('Project author'),
  atviseHost: new InitOption('Atvise server host', Atviseproject.host),
  atvisePortOpc: new InitOption('Atvise OPC port', Atviseproject.port.opc),
  atvisePortHttp: new InitOption('Atvise HTTP port', Atviseproject.port.http),
  configLang: new InitOption({
    type: 'list',
    message: 'Configuration language to use',
    choices: Object.keys(ConfigLangs).map(name => ({ name, value: ConfigLangs[name] })),
  }),
};

/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */
const InitOptionsAsArray = Object.keys(InitOptions)
  .map(name => Object.assign({ name }, InitOptions[name]));

export default InitOptionsAsArray;
