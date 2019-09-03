"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _DisplayTransformer = _interopRequireDefault(require("../../transform/DisplayTransformer"));

var _ScriptTransformer = require("../../transform/ScriptTransformer.js");

var _Mapping = _interopRequireDefault(require("../../transform/Mapping"));

var _AlarmConfigTransformer = _interopRequireDefault(require("../../transform/AlarmConfigTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-useless-escape */

/**
 * An *atvise-scm* project's configuration.
 * @abstract
 */
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
   * @type {boolean|Object}
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
    return [new _AlarmConfigTransformer.default(), new _DisplayTransformer.default(), new _ScriptTransformer.ServerscriptTransformer(), new _ScriptTransformer.QuickDynamicTransformer(), new _Mapping.default()];
  }
  /**
   * The atvise-server nodes that atvise-scm should sync. Defaults to the nodes
   * *AGENT*, *SYSTEM*, *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
   * @type {string[]|NodeId[]}
   */


  static get nodes() {
    return [new _NodeId.default('AGENT'), new _NodeId.default('SYSTEM'), new _NodeId.default('ObjectTypes.PROJECT'), new _NodeId.default('VariableTypes.PROJECT')];
  }
  /**
   * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
   * displays.
   * @type {string[]|NodeId[]}
   */


  static get nodesToWatch() {
    return [new _NodeId.default('AGENT.DISPLAYS'), new _NodeId.default('SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS')];
  }
  /**
   * An array of editor related node ids. They should be ignored in a atvise-scm project.
   * @type {NodeId[]}
   */


  static get EditorRelatedNodes() {
    return [new _NodeId.default('SYSTEM\.JOURNALS\.ProjectHistory')];
  }
  /**
   * An array of server related node ids. They should be ignored in a atvise-scm project
   * as they are read-only.
   * @type {NodeId[]}
   */


  static get ServerRelatedNodes() {
    return [new _NodeId.default('AGENT\.OPCUA\.server_url'), new _NodeId.default('AGENT\.WEBACCESS\.https?[^\.]+\.(state)'), new _NodeId.default('SYSTEM\.INFORMATION\.LOGS\.'), new _NodeId.default('AGENT\.GENERATOR\.METHODS'), new _NodeId.default('AGENT\.MIRROR\.METHODS'), new _NodeId.default('AGENT\.HISTORY\.METHODS'), new _NodeId.default('AGENT\.SCRIPT\.METHODS'), new _NodeId.default('AGENT\.OPCUA\.METHODS'), new _NodeId.default('AGENT\.ALARMING\.METHODS')];
  }
  /**
   * Server nodes atscm manages itself. These include the serverscripts used during pull/push for
   * example.
   * @type {NodeId[]}
   */


  static get AtscmRelatedNodes() {
    return [new _NodeId.default('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm')];
  }
  /**
   * These nodes (and their subnodes, if any) will be ignored by atvise-scm. Defaults to
   * {@link Atviseproject.EditorRelatedNodes} combined with
   * {@link Atviseproject.ServerRelatedNodes}.
   * @type {NodeId[]}
   */


  static get ignoreNodes() {
    return [...this.EditorRelatedNodes, ...this.ServerRelatedNodes, ...this.AtscmRelatedNodes];
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
  /**
   * The *version control system* to optimize tasks for.
   * @type {'git' | 'svn'}
   * @since 1.0.0
   */


  static get vcs() {
    return 'git';
  }
  /**
   * If atvise builder sort order nodes should be stored.
   * @type {boolean}
   * @since 1.0.0
   * @deprecated Mapping source order nodes leads to inconsistent results in many cases.
   */


  static get preserveSortOrderNodes() {
    return false;
  }

}

exports.default = Atviseproject;
//# sourceMappingURL=Atviseproject.js.map