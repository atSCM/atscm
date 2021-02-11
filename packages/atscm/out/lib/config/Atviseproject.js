"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _DisplayTransformer = _interopRequireDefault(require("../../transform/DisplayTransformer"));

var _ScriptTransformer = require("../../transform/ScriptTransformer");

var _Mapping = _interopRequireDefault(require("../../transform/Mapping"));

var _AlarmConfigTransformer = _interopRequireDefault(require("../../transform/AlarmConfigTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-useless-escape */

/**
 * An *atscm* project's configuration.
 * @abstract
 */
class Atviseproject {
  /**
   * The atvise-server's host. Defaults to *localhost*.
   */
  static get host() {
    return 'localhost';
  }
  /**
   * The atvise-server ports to use.
   */


  static get port() {
    return {
      opc: 4840,
      http: 80
    };
  }
  /**
   * The login to use. Return `false` if no login is required (default).
   */


  static get login() {
    return false;
  }
  /**
   * The transformers to use in this project. Returns a {@link DisplayTransformer}, a
   * {@link ScriptTransformer} and a {@link NewlinesTransformer} by default.
   */


  static get useTransformers() {
    return [new _AlarmConfigTransformer.default(), new _DisplayTransformer.default(), new _ScriptTransformer.ServerscriptTransformer(), new _ScriptTransformer.QuickDynamicTransformer(), new _Mapping.default()];
  }
  /**
   * The atvise-server nodes that atscm should sync. Defaults to the nodes *AGENT*, *SYSTEM*,
   * *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
   */


  static get nodes() {
    return [new _NodeId.default('AGENT'), new _NodeId.default('SYSTEM'), new _NodeId.default('ObjectTypes.PROJECT'), new _NodeId.default('VariableTypes.PROJECT')];
  }
  /**
   * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
   * displays.
   */


  static get nodesToWatch() {
    return [new _NodeId.default('AGENT.DISPLAYS'), new _NodeId.default('SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS')];
  }
  /**
   * An array of editor related node ids. They should be ignored in a atscm project.
   */


  static get EditorRelatedNodes() {
    return [new _NodeId.default('SYSTEM.JOURNALS.ProjectHistory')];
  }
  /**
   * An array of server related node ids. They should be ignored in a atscm project
   * as they are read-only.
   */


  static get ServerRelatedNodes() {
    return [new _NodeId.default('AGENT.OPCUA.server_url'), new _NodeId.default('AGENT.WEBACCESS.https?[^.]+.(state)'), new _NodeId.default('SYSTEM.INFORMATION.LOGS.'), new _NodeId.default('AGENT.GENERATOR.METHODS'), new _NodeId.default('AGENT.MIRROR.METHODS'), new _NodeId.default('AGENT.HISTORY.METHODS'), new _NodeId.default('AGENT.SCRIPT.METHODS'), new _NodeId.default('AGENT.OPCUA.METHODS'), new _NodeId.default('AGENT.ALARMING.METHODS')];
  }
  /**
   * Server nodes atscm manages itself. These include the serverscripts used during pull/push for
   * example.
   */


  static get AtscmRelatedNodes() {
    return [new _NodeId.default('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm')];
  }
  /**
   * These nodes (and their subnodes, if any) will be ignored by atscm. Defaults to
   * {@link Atviseproject.EditorRelatedNodes} combined with
   * {@link Atviseproject.ServerRelatedNodes}.
   */


  static get ignoreNodes() {
    return [...this.EditorRelatedNodes, ...this.ServerRelatedNodes, ...this.AtscmRelatedNodes];
  }
  /**
   * Returns an object containing the properties to inspect.
   * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
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
   * @since 1.0.0
   */


  static get vcs() {
    return 'git';
  }
  /**
   * If atvise builder sort order nodes should be stored.
   * @since 1.0.0
   * @deprecated Mapping source order nodes leads to inconsistent results in many cases.
   */


  static get preserveSortOrderNodes() {
    return false;
  }
  /**
   * The connection timeout, in milliseconds.
   */


  static get timeout() {
    return 10000;
  }
  /**
   * Remove `atv:refpx` and `atv:refpy` attributes from XML to minimize diffs between pulls. This
   * will eventually default to *true* in a future atscm version.
   */


  static get removeBuilderRefs() {
    return false;
  }
  /**
   * Sort XML attributes to minimize diffs between pulls. This will eventually default to *true* in
   * a future atscm version.
   */


  static get sortXMLAttributes() {
    return false;
  }

}

exports.default = Atviseproject;
//# sourceMappingURL=Atviseproject.js.map