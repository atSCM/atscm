"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = _interopRequireDefault(require("events"));

var _client_subscription = require("node-opcua/lib/client/client_subscription");

var _read_service = require("node-opcua/lib/services/read_service");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _log = require("../helpers/log");

var _Session = _interopRequireDefault(require("./Session"));

var _NodeBrowser = _interopRequireDefault(require("./NodeBrowser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-plugin-jsdoc does not recognize the "emits" tag */

/* eslint-disable jsdoc/check-tag-names */

/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */

/* eslint-disable jsdoc/check-param-names */

/**
 * Watches the given nodes for value changes.
 * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
 */
class Watcher extends _events.default {
  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = _ProjectConfig.default.nodesToWatch) {
    super();
    /**
     * The browser used to subscribe to server nodes.
     * @type {NodeBrowser}
     */

    this._nodeBrowser = new _NodeBrowser.default({
      handleNode: this._subscribe.bind(this)
    });
    (0, _log.reportProgress)(this._nodeBrowser.browse(nodes), {
      getter: () => this._nodeBrowser._pushed,
      formatter: count => `Subscribed to ${count} nodes`
    }).then(() => this.emit('ready')).catch(err => this.emit('error', err));
    /**
     * Resolved once the server subscription is set up.
     * @type {Promise<any>}
     */

    this.subscriptionStarted = this._setupSubscription().catch(err => this.emit('error', err));
  }
  /**
   * Initializes a server subscription.
   * @return {Promise<node-opcua~ClientSubscription>} A setup subscription.
   */


  _setupSubscription() {
    return _Session.default.create().then(session => new Promise((resolve, reject) => {
      /** The current session, if connected @type {Session} */
      this._session = session;
      const subscription = new _client_subscription.ClientSubscription(session, {
        requestedPublishingInterval: 100,
        requestedLifetimeCount: 1000,
        requestedMaxKeepAliveCount: 12,
        maxNotificationsPerPublish: 10,
        publishingEnabled: true,
        priority: 10
      });
      subscription.on('started', () => resolve(subscription));
      subscription.on('failure', err => reject(err));
    }));
  }
  /**
   * Subscribes to value changes of a single node.
   * @param {BrowsedNode} node A browsed node.
   */


  async _subscribe(node) {
    if (node.nodeClass !== _nodeclass.NodeClass.Variable) {
      return undefined;
    }

    const subscription = await this.subscriptionStarted;
    const nodeId = node.id;
    const item = subscription.monitor({
      nodeId,
      attributeId: _read_service.AttributeIds.Value
    }, {
      clientHandle: 13,
      samplingInterval: 250,
      queueSize: 123,
      discardOldest: true
    });
    return new Promise((resolve, reject) => {
      // Sometimes the changed event is not emitted...
      // Fixes #202
      const timeout = setTimeout(() => {
        _gulplog.default.debug(`Error monitoring '${nodeId.value}': Did not receive initial value. Retry...`);

        item.terminate();
        return this._subscribe(node).then(resolve, reject);
      }, 1000);
      item.once('changed', () => {
        clearTimeout(timeout);
        item.on('changed', this._handleChange.bind(this, {
          nodeId
        }));
        resolve();
      });
      item.on('err', err => {
        clearTimeout(timeout);
        reject(err instanceof Error ? err : new Error(err));
      });
    });
  }
  /**
   * Called once a change has been detected and emits a 'change' or 'delete' event.
   * @param {Object} node The node that changed.
   * @param {?node-opcua~Variant} dataValue The current value.
   */


  _handleChange({
    nodeId
  }, dataValue) {
    this.emit(dataValue.value ? 'change' : 'delete', {
      // nodeClass,
      nodeId,
      value: dataValue.value,
      mtime: dataValue.serverTimestamp
    });
  }
  /**
   * Ends monitoring nodes.
   */


  close() {
    if (this._session) {
      _Session.default.close(this._session).catch(err => this.emit('error', err));
    }
  }

}

exports.default = Watcher;
//# sourceMappingURL=Watcher.js.map