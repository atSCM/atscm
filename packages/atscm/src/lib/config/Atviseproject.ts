/* eslint-disable no-useless-escape */

import NodeId from '../model/opcua/NodeId';
import DisplayTransformer from '../../transform/DisplayTransformer';
import {
  ServerscriptTransformer,
  QuickDynamicTransformer,
} from '../../transform/ScriptTransformer';
import MappingTransformer from '../../transform/Mapping';
import AlarmConfigTransformer from '../../transform/AlarmConfigTransformer';
import { Transformer } from '../..';

interface AtserverPortConfiguration {
  /** The OPC-UA port the atvise-server runs on. */
  opc: number;
  /** The HTTP port the atvise-server can be reached at. */
  http: number;
}

interface AtserverCredentials {
  /** The username to log in with. */
  username: string;
  /** The password to log in with. */
  password: string;
}

type NodesConfiguration = Array<string | NodeId>;

/**
 * An *atscm* project's configuration.
 * @abstract
 */
export default class Atviseproject {
  /**
   * The atvise-server's host. Defaults to *localhost*.
   */
  static get host(): string {
    return 'localhost';
  }

  /**
   * The atvise-server ports to use.
   */
  static get port(): AtserverPortConfiguration {
    return {
      opc: 4840,
      http: 80,
    };
  }

  /**
   * The login to use. Return `false` if no login is required (default).
   */
  static get login(): false | AtserverCredentials {
    return false;
  }

  private static get xmlTransformerOptions() {
    return {
      sortXMLAttributes: this.sortXMLAttributes,
      removeBuilderRefs: this.removeBuilderRefs,
    };
  }

  /**
   * The transformers to use in this project. Returns a {@link DisplayTransformer}, a
   * {@link ScriptTransformer} and a {@link NewlinesTransformer} by default.
   */
  static get useTransformers(): Transformer[] {
    return [
      new AlarmConfigTransformer(),
      new DisplayTransformer(this.xmlTransformerOptions),
      new ServerscriptTransformer(this.xmlTransformerOptions),
      new QuickDynamicTransformer(this.xmlTransformerOptions),
      new MappingTransformer() as any,
    ];
  }

  /**
   * The atvise-server nodes that atscm should sync. Defaults to the nodes *AGENT*, *SYSTEM*,
   * *ObjectTypes.PROJECT* and *VariableTypes.PROJECT*.
   */
  static get nodes(): NodesConfiguration {
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
   */
  static get nodesToWatch(): NodesConfiguration {
    return [new NodeId('AGENT.DISPLAYS'), new NodeId('SYSTEM.LIBRARY.PROJECT.OBJECTDISPLAYS')];
  }

  /**
   * An array of editor related node ids. They should be ignored in a atscm project.
   */
  static get EditorRelatedNodes(): NodesConfiguration {
    return [new NodeId('SYSTEM.JOURNALS.ProjectHistory')];
  }

  /**
   * An array of server related node ids. They should be ignored in a atscm project
   * as they are read-only.
   */
  static get ServerRelatedNodes(): NodesConfiguration {
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
   */
  static get AtscmRelatedNodes(): NodesConfiguration {
    return [new NodeId('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm')];
  }

  /**
   * These nodes (and their subnodes, if any) will be ignored by atscm. Defaults to
   * {@link Atviseproject.EditorRelatedNodes} combined with
   * {@link Atviseproject.ServerRelatedNodes}.
   */
  static get ignoreNodes(): NodesConfiguration {
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
      ignoreNodes: this.ignoreNodes,
    };
  }

  /**
   * The *version control system* to optimize tasks for.
   * @since 1.0.0
   */
  static get vcs(): 'git' | 'svn' {
    return 'git';
  }

  /**
   * If atvise builder sort order nodes should be stored.
   * @since 1.0.0
   * @deprecated Mapping source order nodes leads to inconsistent results in many cases.
   */
  static get preserveSortOrderNodes(): boolean {
    return false;
  }

  /**
   * The connection timeout, in milliseconds.
   */
  static get timeout(): number {
    return 10000;
  }

  /**
   * Remove `atv:refpx` and `atv:refpy` attributes from XML to minimize diffs between pulls. This
   * will eventually default to *true* in a future atscm version.
   */
  static get removeBuilderRefs(): boolean {
    return false;
  }

  /**
   * Sort XML attributes to minimize diffs between pulls. This will eventually default to *true* in
   * a future atscm version.
   */
  static get sortXMLAttributes(): boolean {
    return false;
  }
}
