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

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ImportStream = _interopRequireDefault(require("../lib/gulp/ImportStream"));

var _api = require("../api");

var _version = require("../lib/server/scripts/version");

var _async = require("../lib/helpers/async");

var _tasks = require("../lib/helpers/tasks");

var _Session = _interopRequireDefault(require("../lib/server/Session"));

var _hooks = require("../hooks/hooks");

var _checkAtserver = _interopRequireDefault(require("../hooks/check-atserver"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Imports all xml files needed for atscm usage.
 * @return {Promise<void>} The running task.
 */
async function importTask() {
  const srcStream = (0, _gulp.src)(_serverScripts.default);
  const versionVariant = {
    dataType: _variant.DataType.String,
    value: _package.version
  };

  _Session.default.pool();

  const context = (0, _hooks.setupContext)();
  await (0, _checkAtserver.default)(context);
  return (0, _streamToPromise.default)(srcStream.pipe(new _ImportStream.default())).then(() => (0, _api.writeNode)(_version.versionNode, versionVariant)).catch(err => {
    if (err.statusCode === _opcua_status_code.StatusCodes.BadNodeIdUnknown) {
      const maxTries = 20;
      const retryDelay = 100;
      let tryNo = 0;

      const tryToCreate = () => {
        tryNo++;
        return (0, _api.createNode)(_version.versionNode, {
          name: 'version',
          value: versionVariant
        }).then(async ({
          outputArguments
        }) => {
          if (outputArguments[3].value.length < 2) {
            if (tryNo < maxTries) {
              _gulplog.default.debug(`Create script is not ready yet. Retrying after ${retryDelay}ms`);

              await (0, _async.delay)(retryDelay);
              return tryToCreate();
            }

            throw new Error('CreateNode script is not ready yet. Try again later');
          }

          return true;
        });
      };

      return tryToCreate().then(() => _gulplog.default.debug(`Import worked on attempt # ${tryNo}`));
    }

    throw err;
  }).then(_tasks.finishTask, _tasks.handleTaskError);
}

importTask.description = 'Imports all xml resources needed for atscm usage';
//# sourceMappingURL=import.js.map