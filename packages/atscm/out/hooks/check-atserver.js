"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadProjectRequirement = loadProjectRequirement;
exports.loadRemoteVersion = loadRemoteVersion;
exports.askForConfirmation = askForConfirmation;
exports.approveToContinue = approveToContinue;
exports.default = checkAtserver;

var _opcua_node_ids = require("node-opcua/lib/opcua_node_ids");

var _fsExtra = require("fs-extra");

var _semver = require("semver");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _prompts = _interopRequireDefault(require("prompts"));

var _chalk = require("chalk");

var _api = require("../api");

var _package = require("../../package.json");

var _fs = require("../lib/helpers/fs");

var _NodeId = _interopRequireDefault(require("../lib/model/opcua/NodeId"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const atserverVersionNodeId = new _NodeId.default(`ns=0;i=${_opcua_node_ids.VariableIds.Server_ServerStatus_BuildInfo_SoftwareVersion}`);

async function loadProjectRequirement() {
  const packageManifest = await (0, _fsExtra.readJson)('./package.json');
  return packageManifest.engines && packageManifest.engines.atserver;
}

async function loadRemoteVersion() {
  const raw = (await (0, _api.readNode)(atserverVersionNodeId)).value;
  return (0, _semver.coerce)(raw).version;
}

async function askForConfirmation(_ref) {
  let {
    onAsk
  } = _ref,
      options = _objectWithoutProperties(_ref, ["onAsk"]);

  if (!process.stdin.isTTY) return false;
  if (onAsk) onAsk();
  return (await (0, _prompts.default)(_objectSpread({
    type: 'confirm',
    name: 'confirmed'
  }, options))).confirmed;
}

async function approveToContinue({
  log,
  continueOnError
}, error) {
  if (continueOnError) {
    log.warn((0, _chalk.red)(error.message));
    log.warn(`Using --continue, skipping...`);
    return;
  }

  const shouldContinue = await askForConfirmation({
    onAsk: () => _gulplog.default.error((0, _chalk.red)(error.message)),
    message: 'Do you want to continue anyway?'
  });

  if (!shouldContinue) {
    throw error;
  }
}

async function checkAtserver(context) {
  const {
    log
  } = context;
  log.debug('Checking atserver version');
  const atscmRequirement = _package.engines.atserver;
  const [projectRequirement, remoteVersion] = await Promise.all([loadProjectRequirement(), loadRemoteVersion()]);

  if (!(0, _semver.satisfies)(remoteVersion, atscmRequirement)) {
    log.debug(`Version ${remoteVersion} does not satisfy requirement ${atscmRequirement}`);
    log.warn((0, _chalk.yellow)(`Your atvise server version (${remoteVersion}) is not supported, it may or may not work.`));

    if ((0, _semver.gtr)(remoteVersion, atscmRequirement)) {
      log.info(`You're running a newer version of atvise server. Please run 'atscm update' to check for updates.`);
    } else {
      log.info(`Please upgrade to atserver ${(0, _semver.minVersion)(atscmRequirement)} or above.`);
    }
  }

  let updatePackage = false;

  if (!projectRequirement) {
    log.info(`Your package.json file doesn't specify an atserver version, adding it...`);
    updatePackage = true;
  } else if (!(0, _semver.satisfies)(remoteVersion, projectRequirement)) {
    await approveToContinue(context, new Error(`Your project is setup with atserver ${projectRequirement} but you're using ${remoteVersion}`));
    updatePackage = await askForConfirmation({
      message: `Use atvise server ${remoteVersion} as new default?`
    });
  } else {
    log.debug(`Running against atserver ${remoteVersion}`);
  }

  if (updatePackage) {
    await (0, _fs.updateJson)('./package.json', current => {
      /* eslint-disable no-param-reassign */
      if (!current.engines) current.engines = {};
      current.engines.atserver = remoteVersion;
      /* eslint-enable no-param-reassign */

      return current;
    });
  }
}
//# sourceMappingURL=check-atserver.js.map