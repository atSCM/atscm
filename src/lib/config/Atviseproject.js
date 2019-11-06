/* eslint-disable no-useless-escape */

import NodeId from '../model/opcua/NodeId';
import DisplayTransformer from '../../transform/DisplayTransformer';
import {
  ServerscriptTransformer,
  QuickDynamicTransformer,
} from '../../transform/ScriptTransformer.js';
import MappingTransformer from '../../transform/Mapping';
import AlarmConfigTransformer from '../../transform/AlarmConfigTransformer';

/**
 * An *atscm* project's configuration.
 * @abstract
 */
export default class Atviseproject {
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
      http: 80,
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
    return [
      new AlarmConfigTransformer(),
      new DisplayTransformer(),
      new ServerscriptTransformer(),
      new QuickDynamicTransformer(),
      new MappingTransformer(),
    ];
  }

  /**
   * The atvise-server nodes that atscm should sync. Defaults to the nodes
   * *AGENT*, *SYSTEM*, *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
   * @type {string[]|NodeId[]}
   */
  static get nodes() {
    return [
      new NodeId('AGENT'),
      new NodeId('SYSTEM'),
      new NodeId('ObjectTypes.PROJECT'),
      new NodeId('VariableTypes.PROJECT'),
    ];
  }

  /**
   * The atvise-server nodes to watch in the corresponding tasks. Defaults to all nodes containing
   * displays.
   * @type {string[]|NodeId[]}
   */
  static get nodesToWatch() {
    return [new NodeId('AGENT.DISPLAYS'), new NodeId('SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS')];
  }

  /**
   * An array of editor related node ids. They should be ignored in a atscm project.
   * @type {NodeId[]}
   */
  static get EditorRelatedNodes() {
    return [new NodeId('SYSTEM.JOURNALS.ProjectHistory')];
  }

  /**
   * An array of server related node ids. They should be ignored in a atscm project
   * as they are read-only.
   * @type {NodeId[]}
   */
  static get ServerRelatedNodes() {
    return [
      new NodeId('AGENT.OPCUA.server_url'),
      new NodeId('AGENT.WEBACCESS.https?[^.]+.(state)'),
      new NodeId('SYSTEM.INFORMATION.LOGS.'),
      new NodeId('AGENT.GENERATOR.METHODS'),
      new NodeId('AGENT.MIRROR.METHODS'),
      new NodeId('AGENT.HISTORY.METHODS'),
      new NodeId('AGENT.SCRIPT.METHODS'),
      new NodeId('AGENT.OPCUA.METHODS'),
      new NodeId('AGENT.ALARMING.METHODS'),
    ];
  }

  /**
   * Server nodes atscm manages itself. These include the serverscripts used during pull/push for
   * example.
   * @type {NodeId[]}
   */
  static get AtscmRelatedNodes() {
    return [new NodeId('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm')];
  }

  /**
   * These nodes (and their subnodes, if any) will be ignored by atscm. Defaults to
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
      ignoreNodes: this.ignoreNodes,
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

  /**
   * The connection timeout, in milliseconds.
   * @type {number}
   */
  static get timeout() {
    return 10000;
  }
}
