"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _semver = require("semver");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _src = _interopRequireDefault(require("../lib/gulp/src"));

var _PushStream = _interopRequireDefault(require("../lib/gulp/PushStream"));

var _api = require("../api");

var _version = require("../lib/server/scripts/version");

var _package = require("../../package.json");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  _gulplog.default.debug('Checking server setup');

  return (0, _api.readNode)(_version.versionNode).catch(err => {
    if (err.statusCode && err.statusCode === _opcua_status_code.StatusCodes.BadNodeIdUnknown) {
      throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), {
        originalError: err
      });
    }

    throw err;
  }).then(({
    value: version
  }) => {
    const required = _package.dependencies['@atscm/server-scripts'];

    _gulplog.default.debug(`Found server scripts version: ${version}`);

    try {
      const valid = (0, _semver.satisfies)(version.split('-beta')[0], required);
      return {
        version,
        valid,
        required
      };
    } catch (err) {
      throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), {
        originalError: err
      });
    }
  }).then(({
    valid,
    version,
    required
  }) => {
    if (!valid) {
      throw new Error(`Invalid server scripts version: ${version} (${required} required)
- Please run 'atscm import' again to update`);
    }
  }).then(() => (0, _streamToPromise.default)(new _PushStream.default((0, _src.default)('./src/'))));
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map