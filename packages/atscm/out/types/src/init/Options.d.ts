/**
 * A map providing dirnames for config langs
 * @type {Map<String, String>}
 */
export const ConfigLangs: Map<string, string>;
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
export const InitOptions: any;
export default InitOptionsAsArray;
/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */
declare const InitOptionsAsArray: InitOption[];
import InitOption from "../lib/init/Option";
