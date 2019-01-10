"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SubscribeStream = void 0;

var _events = _interopRequireDefault(require("events"));

var _client_subscription = require("node-opcua/lib/client/client_subscription");

var _read_service = require("node-opcua/lib/services/read_service");

var _subscription_service = _interopRequireDefault(require("node-opcua/lib/services/subscription_service"));

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _ProjectConfig = _interopRequireDefault(require("../../config/ProjectConfig"));

var _NodeStream = _interopRequireDefault(require("./NodeStream"));

var _QueueStream = _interopRequireDefault(require("./QueueStream"));

var _Session = _interopRequireDefault(require("./Session"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-plugin-jsdoc does not recognize the "emits" tag */

/* eslint-disable jsdoc/check-tag-names */

/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */

/* eslint-disable jsdoc/check-param-names */

/**
 * A stream that monitors changes in the read nodes.
 */
class SubscribeStream extends _QueueStream.default {
  /**
   * Creates a new SubscribeStream based on some options.
   * @param {Object} options The stream options to apply.
   */
  constructor(options = {}) {
    super(Object.assign(options, {
      keepSessionAlive: true
    })); // FIXME: Option not handled.

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
    const subscription = new _client_subscription.ClientSubscription(this.session, {
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
   * Returns an error message specifically for the given reference description.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to get
   * the error message for.
   * @return {string} The specific error message.
   */


  processErrorMessage(referenceDescription) {
    return `Error reading node ${referenceDescription.nodeId.toString()}`;
  }
  /**
   * Monitors the nodes specified by a {@link node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} referenceDescription The refernce description to use.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */


  processChunk(referenceDescription, handleErrors) {
    const nodeId = referenceDescription.id;
    const item = this.subscription.monitor({
      nodeId,
      attributeId: _read_service.AttributeIds.Value
    }, {
      clientHandle: 13,
      samplingInterval: 250,
      queueSize: 1,
      discardOldest: true
    }, _subscription_service.default.TimestampsToReturn.Both);
    item.on('changed', dataValue => {
      if (!this._trackChanges) {
        handleErrors(null, _opcua_status_code.StatusCodes.Good, done => done()); // Ignore first notification
      } else {
        this.emit(dataValue.value ? 'change' : 'delete', {
          nodeClass: referenceDescription.nodeClass,
          nodeId,
          value: dataValue.value,
          references: referenceDescription.references,
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
        handleErrors(err);
      } else {
        handleErrors(new Error(err));
      }
    });
  }
  /**
   * Buffers all read node descriptions until the subscription started, then calls
   * {@link QueueStream#_enqueueChunk} with them.
   * @param {node-opcua~ReferenceDescription} desc Reference description of the node to transform.
   * @param {string} enc The encoding used.
   * @param {function(err: ?Error)} callback Called with the error that occured while trying to
   * monitor the given node.
   */


  _transform(desc, enc, callback) {
    if (desc.nodeClass !== _nodeclass.NodeClass.Variable) {
      callback();
      return;
    }

    if (this.subscription) {
      this._enqueueChunk(desc);

      callback();
    } else {
      this.once('subscription-started', () => {
        this._enqueueChunk(desc);

        callback();
      });
    }
  }
  /**
   * Starts tracking node changes.
   * @param {function(err: ?Error)} callback Called once flushing is complete.
   */


  _flush(callback) {
    super._flush(err => {
      this._trackChanges = true;
      callback(err);
    });
  }

}
/**
 * Watches the given nodes for value changes.
 * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
 */


exports.SubscribeStream = SubscribeStream;

class Watcher extends _events.default {
  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = _ProjectConfig.default.nodesToWatch) {
    super();
    /**
     * The node stream that discovers the nodes to watch.
     * @type {NodeStream}
     */

    this._nodeStream = new _NodeStream.default(nodes).on('error', err => this.emit('error', err));
    /**
     * The stream that starts monitoring the nodes to watch.
     * @type {SubscribeStream}
     */

    this._subscribeStream = new SubscribeStream().on('error', err => this.emit('error', err));

    this._nodeStream.pipe(this._subscribeStream); // "pipe" subscribe stream


    this._subscribeStream.on('data', () => {});

    this._subscribeStream.on('end', () => this.emit('ready'));

    this._subscribeStream.on('change', event => this.emit('change', event));

    this._subscribeStream.on('delete', event => this.emit('delete', event));
  }
  /**
   * Ends monitoring nodes.
   */


  close() {
    if (this._subscribeStream.session) {
      _Session.default.close(this._subscribeStream.session).catch(err => this.emit('error', err));
    }
  }

}

exports.default = Watcher;
//# sourceMappingURL=Watcher.js.map