"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performPush = performPush;
exports.default = push;

var _semver = require("semver");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _src = _interopRequireDefault(require("../lib/gulp/src.js"));

var _api = require("../api");

var _version = require("../lib/server/scripts/version");

var _package = require("../../package.json");

var _Transformer = _interopRequireWildcard(require("../lib/transform/Transformer.js"));

var _NodeId = _interopRequireDefault(require("../lib/model/opcua/NodeId.js"));

var _Node = require("../lib/model/Node.js");

var _log = require("../lib/helpers/log.js");

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig.js"));

var _tasks = require("../lib/helpers/tasks.js");

var _Session = _interopRequireDefault(require("../lib/server/Session.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const openInBuilderStatus = new Set([_opcua_status_code.StatusCodes.BadUserAccessDenied, _opcua_status_code.StatusCodes.BadNotWritable]);
const ignoredReferences = new Set([_Node.ReferenceTypeIds.toParent, _Node.ReferenceTypeIds.HasTypeDefinition, _Node.ReferenceTypeIds.HasModellingRule]);

function performPush(path, options) {
  const applyTransforms = _Transformer.default.combinedTransformer(_ProjectConfig.default.useTransformers, _Transformer.TransformDirection.FromFilesystem);

  const ensureReferences = node => {
    const references = [...node.references].reduce((result, [key, value]) => {
      if (ignoredReferences.has(key)) {
        return result;
      }

      return Object.assign(result, {
        [key]: [...value].map(s => typeof s === 'string' ? `ns=1;s=${s}` : s)
      });
    }, {});

    if (Object.keys(references).length > 0) {
      return (0, _api.addReferences)(node.nodeId, references).then(({
        outputArguments
      }) => {
        const [{
          value: failures
        }] = outputArguments[3].value;

        if (failures) {
          throw new Error(`Failed to create reference(s) from ${node.nodeId} to ${failures.join(', ')}`);
        } else {
          _gulplog.default.debug(`Added ${Object.keys(references).length} reference(s) to ${node.nodeId}`);
        }
      }).catch(err => {
        throw Object.assign(err, {
          node
        });
      });
    }

    return Promise.resolve();
  };

  const create = node => {
    const nodeId = new _NodeId.default(node.nodeId);
    let parentNodeId = node.parent && node.parent.nodeId;

    if (!node.parent) {
      parentNodeId = nodeId.parent;

      _gulplog.default.debug(`Assuming ${parentNodeId} as parent of ${node.nodeId}`);
    }

    return (0, _api.createNode)(nodeId, {
      name: node.name,
      parentNodeId,
      nodeClass: node.nodeClass,
      typeDefinition: node.typeDefinition,
      value: node.nodeClass === _nodeclass.NodeClass.Variable && node.variantValue
    }).then(({
      outputArguments
    }) => {
      const [{
        value: createdNode
      }, {
        value: createFailed
      }] = outputArguments[3].value;

      if (createFailed) {
        _gulplog.default.warn('Failed to create node', node.nodeId);

        return Promise.resolve();
      } else if (createdNode) {
        _gulplog.default.debug('Created node', node.nodeId);
      } else {// Node already existed
      }

      return ensureReferences(node);
    }).catch(err => {
      throw Object.assign(err, {
        node
      });
    });
  };

  return (0, _src.default)(path, _objectSpread({}, options, {
    readNodeFile(node) {
      const r = _ProjectConfig.default.useTransformers.reverse().reduce((result, t) => result === undefined ? t.readNodeFile(node) : result, undefined);

      return r === undefined ? true : r;
    },

    async handleNode(node) {
      const context = this;
      await applyTransforms(node, context);

      if (node.push === false) {
        // Skip write
        return false;
      } // Create / write node


      if (node.nodeClass !== _nodeclass.NodeClass.Variable) {
        return create(node);
      } // console.error('write', node.nodeId, node.value);


      return (0, _api.writeNode)(`ns=1;s=${node.nodeId}`, node.variantValue).then(() => ensureReferences(node), err => {
        if (openInBuilderStatus.has(err.statusCode)) {
          _gulplog.default.warn(`Error writing node ${node.nodeId}
    - Make sure it is not opened in atvise builder
    - Make sure the corresponding datasource is connected`);

          return _opcua_status_code.StatusCodes.Good;
        }

        if (err.statusCode === _opcua_status_code.StatusCodes.BadNodeIdUnknown) {
          _gulplog.default.debug(`Node ${node.nodeId} does not exist: Attempting to create it...`);

          return create(node);
        }

        throw Object.assign(err, {
          node
        });
      });
    }

  }));
}
/**
 * Pushes {@link AtviseFile}s to atvise server.
 */


function push() {
  _Session.default.pool();

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
  }).then(() => {
    const promise = performPush('./src');
    return (0, _log.reportProgress)(promise, {
      getter: () => promise.browser._pushedPath.size,
      formatter: count => `Processed ${count} files`
    });
  }).then(_tasks.finishTask, _tasks.handleTaskError);
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map