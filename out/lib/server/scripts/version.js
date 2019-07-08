"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.versionNode = void 0;

var _NodeId = _interopRequireDefault(require("../../model/opcua/NodeId"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/prefer-default-export */

/**
 * The node containing the currently installed server-scripts version.
 * @type {NodeId}
 */
const versionNode = new _NodeId.default('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.version');
exports.versionNode = versionNode;
//# sourceMappingURL=version.js.map