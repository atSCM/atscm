"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * The path to the project's configuration file.
 */
const path = exports.path = process.env.ATSCM_CONFIG_PATH;

/**
 * The current project's configuration.
 * @type {Atviseproject}
 */
const config = require(path).default;

exports.default = config;