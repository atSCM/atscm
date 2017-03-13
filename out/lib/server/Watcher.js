'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SubscribeStream = undefined;

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodeOpcua = require('node-opcua');

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _NodeStream = require('./NodeStream');

var _NodeStream2 = _interopRequireDefault(_NodeStream);

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that monitors changes in the read nodes.
 */
class SubscribeStream extends _Stream2.default {

  /**
   * Creates a new SubscribeStream.
   */
  constructor() {
    super({ keepSessionAlive: true });

    /**
     * Set to true once all nodes are monitored.
     * @type {Boolean}
     */
    this._trackChanges = false;

    this.once('session-open', () => this.createSubscription());
  }

  /**
   * Creates the server subscription to monitor nodes with.
   * @emit {node-opcua~ClientSubscription} Emits a `subscription-started` event once the
   * subscription started.
   */
  createSubscription() {
    const subscription = new _nodeOpcua.ClientSubscription(this.session, {
      requestedPublishingInterval: 100,
      requestedLifetimeCount: 1000,
      requestedMaxKeepAliveCount: 12,
      maxNotificationsPerPublish: 10,
      publishingEnabled: true,
      priority: 10
    });

    subscription.on('started', () => {
      /**
       * The {@link node-opcua~ClientSubscription} to use to monitor nodes.
       * @type {node-opcua~ClientSubscription}
       */
      this.subscription = subscription;
      this.emit('subscription-started', subscription);
    });

    subscription.on('failure', err => this.emit('error', err));
  }

  /**
   * Starts monitoring of the node with the given {@link node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} referenceDescription Reference description of the node
   * to monitor.
   * @param {function(err: Error?)} callback Called with the error that occured while trying to
   * monitor the given node.
   */
  monitorNode(referenceDescription, callback) {
    const nodeId = referenceDescription.nodeId;

    const item = this.subscription.monitor({
      nodeId,
      attributeId: _nodeOpcua.AttributeIds.Value
    }, {
      clientHandle: 13,
      samplingInterval: 250,
      queueSize: 1,
      discardOldest: true
    }, _nodeOpcua.subscription_service.TimestampsToReturn.Both);

    item.on('changed', dataValue => {
      if (!this._trackChanges) {
        callback(); // Ignore first notification
      } else {
        this.emit('change', {
          nodeId,
          value: dataValue.value,
          referenceDescription,
          mtime: dataValue.serverTimestamp
        });
      }
    });

    item.on('err', err => {
      /*
        This works around a bug in node-opcua:
        Instead of a error a string is emitted
        FIXME: Remove once bug is fixed
       */
      if (err instanceof Error) {
        const error = err;
        error.message = `Error monitoring ${nodeId.toString()}: ${err.message}`;

        callback(error);
      } else {
        callback(new Error(`Error monitoring ${nodeId.toString()}: ${err}`));
      }
    });

    return item;
  }

  /**
   * Buffers all read node descriptions until the subscription started, then calls
   * {@link SubscribeStream#monitorNode} with them.
   * @param {node-opcua~ReferenceDescription} desc Reference description of the node to transform.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error)} callback Called with the error that occured while trying to
   * monitor the given node.
   */
  _transform(desc, enc, callback) {
    if (this.subscription) {
      this.monitorNode(desc, callback);
    } else {
      this.once('subscription-started', () => this.monitorNode(desc, callback));
    }
  }

  /**
   * Overriding this method prevents closing the session.
   * @param {function()} callback Called immediately.
   */
  _flush(callback) {
    this._trackChanges = true;
    callback();
  }

}

exports.SubscribeStream = SubscribeStream; /**
                                            * Watches the given nodes for value changes.
                                            * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
                                            */

class Watcher extends _events2.default {

  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = _ProjectConfig2.default.nodesToWatch) {
    super();

    /**
     * The node stream that discovers the nodes to watch.
     * @type {NodeStream}
     */
    this._nodeStream = new _NodeStream2.default(nodes).on('error', err => this.emit('error', err));

    /**
     * The stream that starts monitoring the nodes to watch.
     * @type {SubscribeStream}
     */
    this._subscribeStream = new SubscribeStream().on('error', err => this.emit('error', err));

    this._nodeStream.pipe(this._subscribeStream);

    this._subscribeStream.on('finish', () => this.emit('ready'));
    this._subscribeStream.on('change', event => this.emit('change', event));
  }

  /**
   * Ends monitoring nodes.
   */
  close() {
    if (this._subscribeStream.session) {
      _Session2.default.close(this._subscribeStream.session).catch(err => this.emit('error', err));
    }
  }

}
exports.default = Watcher;