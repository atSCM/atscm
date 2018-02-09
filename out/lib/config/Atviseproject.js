'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _DisplayTransformer = require('../../transform/DisplayTransformer');

var _DisplayTransformer2 = _interopRequireDefault(_DisplayTransformer);

var _ScriptTransformer = require('../../transform/ScriptTransformer');

var _ScriptTransformer2 = _interopRequireDefault(_ScriptTransformer);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

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
    return _defaults2.default.host;
  }

  /**
   * The atvise-server ports to use.
   * @type {Object}
   * @property {number} [opc=4840] The OPC-UA port the atvise-server runs on.
   * @property {number} [http=80] The HTTP port the atvise-server can be reached at.
   */
  static get port() {
    return {
      opc: _defaults2.default.port.opc,
      http: _defaults2.default.port.http
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
   * The source directory path.
   * @type {string}
   */
  static get RelativeSourceDirectoryPath() {
    return './src';
  }

  /**
   * The diff file path.
   * @type {string}
   */
  static get DiffFileName() {
    return 'diff.log';
  }

  /**
   * The delete file paths.
   * @type {Object}
   * @property {String} server The server delete file name.
   * @property {String} fs The file system delete file name.
   */
  static get DeleteFileNames() {
    return {
      server: 'deleteServer.txt',
      fs: 'deleteFs.txt'
    };
  }

  /**
   * The xml resource directory path.
   * @type {string}
   */
  static get RelativeXmlResourcesPath() {
    return './node_modules/atscm/xml_resources/**/*.xml';
  }

  /**
   * The transformers to use in this project. Defaults to a single {@link DisplayTransformer}
   * @type {Transformer[]}
   */
  static get useTransformers() {
    return [new _DisplayTransformer2.default(), new _ScriptTransformer2.default()];
  }

  /**
   * The atvise-server nodes that atvise-scm should sync. Defaults to
   * `['ns=1;s=AGENT', 'ns=1;s=SYSTEM', 'ns=1;s=ObjectTypes.PROJECT']`.
   * @type {String[]|NodeId[]}
   */
  static get nodes() {
    return [new _NodeId2.default('AGENT'), new _NodeId2.default('SYSTEM'), new _NodeId2.default('ObjectTypes.PROJECT'), new _NodeId2.default('VariableTypes.PROJECT')];
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
    return [
    // eslint-disable-next-line max-len
    new _NodeId2.default('AGENT\.OPCUA\.server_url'), new _NodeId2.default('AGENT\.WEBACCESS\.https?[0-9]+\.(state|port)'), new _NodeId2.default('SYSTEM\.INFORMATION\.LOGS\.'), new _NodeId2.default('SYSTEM\.LIBRARY\.ATVISE\.SERVERSCRIPTS\.atscm')];
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