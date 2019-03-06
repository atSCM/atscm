"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performPull = performPull;
exports.default = pull;

var _mri = _interopRequireDefault(require("mri"));

var _fsExtra = require("fs-extra");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _NodeBrowser = _interopRequireDefault(require("../lib/server/NodeBrowser"));

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig"));

var _Transformer = _interopRequireWildcard(require("../lib/transform/Transformer.js"));

var _dest = _interopRequireDefault(require("../lib/gulp/dest"));

var _log = require("../lib/helpers/log");

var _tasks = require("../lib/helpers/tasks");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function performPull(nodes, options = {}) {
  const writeStream = (0, _dest.default)('./src');

  const applyTransforms = _Transformer.default.combinedTransformer(_ProjectConfig.default.useTransformers, _Transformer.TransformDirection.FromDB);

  const browser = new _NodeBrowser.default(_objectSpread({}, options, {
    async handleNode(node, {
      transform = true
    } = {}) {
      const context = {
        _added: [],

        addNode(n) {
          this._added.push(n);
        }

      };

      if (transform) {
        await applyTransforms(node, context);
      }

      await writeStream.writeAsync(node); // Enqueue added nodes

      if (context._added.length) {
        context._added.forEach(n => this.addNode(n));
      }
    }

  }));
  return Object.assign(browser.browse(nodes).then(() => writeStream.writeRenamefile()), {
    browser
  });
}
/**
 * Pulls all nodes from atvise server.
 * @param {Object} [options] The options to use.
 * @param {boolean} [options.clean] If the source directory should be cleaned first.
 */


function pull(options) {
  const {
    clean
  } = typeof options === 'object' ? options : (0, _mri.default)(process.argv.slice(2));
  return Promise.resolve().then(() => {
    if (clean) {
      _gulplog.default.info('Using --clean, removing pulled files first');

      return (0, _fsExtra.emptyDir)('./src');
    }

    return Promise.resolve();
  }).then(() => {
    const promise = performPull(_ProjectConfig.default.nodes);
    return (0, _log.reportProgress)(promise, {
      getter: () => promise.browser._pushed,
      formatter: count => `Processed ${count} nodes`
    });
  }).catch(_tasks.handleTaskError);
}

pull.description = 'Pull all nodes from atvise server';
//# sourceMappingURL=pull.js.map