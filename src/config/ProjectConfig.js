/**
 * The path to the project's configuration file.
 * @type {string}
 */
export const path = process.env.ATSCM_CONFIG_PATH;

/**
 * The current project's configuration.
 * @type {Atviseproject}
 */
const config = require(path).default;

export default config;
