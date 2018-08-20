'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _NodeId = require('../model/opcua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _DisplayTransformer = require('../../transform/DisplayTransformer');

var _DisplayTransformer2 = _interopRequireDefault(_DisplayTransformer);

var _ScriptTransformer = require('../../transform/ScriptTransformer');

var _ScriptTransformer2 = _interopRequireDefault(_ScriptTransformer);

var _Mapping = require('../../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An *atvise-scm* project's configuration.
 * @abstract
 */
/* eslint-disable no-useless-escape */

class Atviseproject {

  /**
   * The atvise-server's host. Defaults to *localhost*.
   * @type {string}
   */
  static get host() {
    return 'localhost';
  }

  /**
   * The atvise-server ports to use.
   * @type {Object}
   * @property {number} [opc=4840] The OPC-UA port the atvise-server runs on.
   * @property {number} [http=80] The HTTP port the atvise-server can be reached at.
   */
  static get port() {
    return {
      opc: 4840,
      http: 80
    };
  }

  /**
   * The login to use. Return `false` if no login is required (default).
   * @type {Boolean|Object}
   * @property {string} username The username to log in with.
   * @property {string} password The password to log in with.
   */
  static get login() {
    return false;
  }

  /**
   * The transformers to use in this project. Returns a {@link DisplayTransformer}, a
   * {@link ScriptTransformer} and a {@link NewlinesTransformer} by default.
   * @type {Transformer[]}
   */
  static get useTransformers() {
    return [new _DisplayTransformer2.default(), new _ScriptTransformer2.default(), new _Mapping2.default()];
  }

  /**
   * The atvise-server nodes that atvise-scm should sync. Defaults to the nodes
   * *AGENT*, *SYSTEM*, *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
   * @type {String[]|NodeId[]}
   */
  static get nodes() {
    return [new _NodeId2.default('AGENT'), new _NodeId2.default('SYSTEM'), new _NodeId2.default('ObjectTypes.PROJECT'), new _NodeId2.default('VariableTypes.PROJECT')];
  }

  /**
   * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
   * displays.
   * @type {String[]|NodeId[]}
   */
  static get nodesToWatch() {
    return [new _NodeId2.default('AGENT.DISPLAYS'), new _NodeId2.default('SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS')];
  }

  /**
   * An array of editor related node ids. They should be ignored in a atvise-scm project.
   * @type {NodeId[]}
   */
  static get EditorRelatedNodes() {
    return [new _NodeId2.default('SYSTEM\.JOURNALS\.ProjectHistory')];
  }

  /**
   * An array of server related node ids. They should be ignored in a atvise-scm project
   * as they are read-only.
   * @type {NodeId[]}
   */
  static get ServerRelatedNodes() {
    return [new _NodeId2.default('AGENT\.OPCUA\.server_url'), new _NodeId2.default('AGENT\.WEBACCESS\.https?[^\.]+\.(state)'), new _NodeId2.default('SYSTEM\.INFORMATION\.LOGS\.'), new _NodeId2.default('AGENT\.GENERATOR\.METHODS'), new _NodeId2.default('AGENT\.MIRROR\.METHODS'), new _NodeId2.default('AGENT\.HISTORY\.METHODS'), new _NodeId2.default('AGENT\.SCRIPT\.METHODS'), new _NodeId2.default('AGENT\.OPCUA\.METHODS')];
  }

  /**
   * These nodes (and their subnodes, if any) will be ignored by atvise-scm. Defaults to
   * {@link Atviseproject.EditorRelatedNodes} combined with
   * {@link Atviseproject.ServerRelatedNodes}.
   * @type {NodeId[]}
   */
  static get ignoreNodes() {
    return this.EditorRelatedNodes.concat(this.ServerRelatedNodes);
  }

  /**
   * Returns an object containing the properties to inspect.
   * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
   * @return {Object} The object to inspect.
   */
  static inspect() {
    return {
      host: this.host,
      port: this.port,
      login: this.login,
      useTransformers: this.useTransformers,
      nodes: this.nodes,
      nodesToWatch: this.nodesToWatch,
      ignoreNodes: this.ignoreNodes
    };
  }

}
exports.default = Atviseproject;
//# sourceMappingURL=Atviseproject.js.map