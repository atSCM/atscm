"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performPush = performPush;
exports.default = push;

var _gulplog = _interopRequireDefault(require("gulplog"));

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _src = _interopRequireDefault(require("../lib/gulp/src"));

var _api = require("../api");

var _Transformer = _interopRequireWildcard(require("../lib/transform/Transformer.js"));

var _NodeId = _interopRequireDefault(require("../lib/model/opcua/NodeId.js"));

var _Node = require("../lib/model/Node");

var _log = require("../lib/helpers/log.js");

var _ProjectConfig = _interopRequireDefault(require("../config/ProjectConfig.js"));

var _tasks = require("../lib/helpers/tasks.js");

var _Session = _interopRequireDefault(require("../lib/server/Session.js"));

var _checkServerscripts = _interopRequireDefault(require("../hooks/check-serverscripts"));

var _checkAtserver = _interopRequireDefault(require("../hooks/check-atserver"));

var _hooks = require("../hooks/hooks");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Status codes indicating a node is opened in atvise builder and therefore not writable right now.
 * @type {Set<node-opcua~StatusCodes>}
 */
const openInBuilderStatus = new Set([_opcua_status_code.StatusCodes.BadUserAccessDenied, _opcua_status_code.StatusCodes.BadNotWritable]);
/**
 * The reference types ignored when adding references. The corresponding references are created
 * alongside the node itself using the 'CreateNode' server script.
 * @type {Set<node-opcua~ReferenceTypeId>}
 */

const ignoredReferences = new Set([_Node.ReferenceTypeIds.toParent, _Node.ReferenceTypeIds.HasTypeDefinition // ReferenceTypeIds.HasModellingRule,
]);
/**
 * Pushes the given path to the server.
 * @param {string} path The local path to push.
 * @param {Object} options Options passed to {@link src}.
 */

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
      modellingRule: node.modellingRule,
      reference: _Node.ReferenceTypeNames[node.references.getSingle(_Node.ReferenceTypeIds.toParent)],
      value: node.nodeClass && node.nodeClass.value === _nodeclass.NodeClass.Variable.value && node.variantValue
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

  return (0, _src.default)(path, _objectSpread(_objectSpread({}, options), {}, {
    readNodeFile(node) {
      const r = _ProjectConfig.default.useTransformers.reverse().reduce((result, t) => result === undefined ? t.readNodeFile(node) : result, undefined);

      return r === undefined ? true : r;
    },

    async handleNode(node) {
      // NOTE: context = this
      await applyTransforms(node, this);

      if (node.push === false) {
        // Skip write
        return false;
      } // Create / write node


      if (node.nodeClass.value !== _nodeclass.NodeClass.Variable.value) {
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


async function push() {
  _Session.default.pool();

  const context = (0, _hooks.setupContext)();
  await (0, _checkAtserver.default)(context);
  await (0, _checkServerscripts.default)(context);
  const promise = performPush('./src');
  return (0, _log.reportProgress)(promise, {
    getter: () => promise.browser._pushedPath.size,
    formatter: count => `Processed ${count} files`
  }).then(_tasks.finishTask, _tasks.handleTaskError);
}

push.description = 'Push all stored nodes to atvise server';
//# sourceMappingURL=push.js.map