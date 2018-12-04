"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = importTask;

var _gulp = require("gulp");

var _serverScripts = _interopRequireDefault(require("@atscm/server-scripts"));

var _package = require("@atscm/server-scripts/package.json");

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _variant = require("node-opcua/lib/datamodel/variant");

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _ImportStream = _interopRequireDefault(require("../lib/gulp/ImportStream"));

var _api = require("../api");

var _version = require("../lib/server/scripts/version");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Imports all xml files needed for atscm usage.
 * @return {Promise<void>} The running task.
 */
function importTask() {
  const srcStream = (0, _gulp.src)(_serverScripts.default);
  const versionVariant = {
    dataType: _variant.DataType.String,
    value: _package.version
  };
  return (0, _streamToPromise.default)(srcStream.pipe(new _ImportStream.default())).then(() => (0, _api.writeNode)(_version.versionNode, versionVariant)).catch(err => {
    if (err.statusCode === _opcua_status_code.StatusCodes.BadNodeIdUnknown) {
      return (0, _api.createNode)(_version.versionNode, {
        name: 'version',
        value: versionVariant
      });
    }

    throw err;
  });
}

importTask.description = 'Imports all xml resources needed for atscm usage';
//# sourceMappingURL=import.js.map