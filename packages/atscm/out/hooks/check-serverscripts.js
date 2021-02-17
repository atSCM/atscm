"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = checkServerscripts;

var _semver = require("semver");

var _api = require("../api");

var _version = require("../lib/server/scripts/version");

var _package = require("../../package.json");

async function checkServerscripts({
  log
}) {
  log.debug('Checking installed serverscripts');
  const required = _package.dependencies['@atscm/server-scripts'];
  let version;

  try {
    version = (await (0, _api.readNode)(_version.versionNode)).value;
    const [release] = version.split('-beta');
    const valid = (0, _semver.satisfies)(release, required);
    if (!valid) throw new Error('Invalid version');
    log.debug(`Serverscripts ${version} installed (${required} required)`);
  } catch (error) {
    throw Object.assign(new Error(`Invalid server script version: ${version || 'not installed'} (${required} required)
- Please run 'atscm import' again to update`), {
      originalError: error
    });
  }
}
//# sourceMappingURL=check-serverscripts.js.map