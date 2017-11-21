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

var _BrowseStream = require('../pull/BrowseStream');

var _BrowseStream2 = _interopRequireDefault(_BrowseStream);

var _QueueStream = require('../stream/QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

var _Session = require('../ua/Session');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that monitors changes in the read nodes.
 */
class SubscribeStream extends _QueueStream2.default {

  /**
   * Creates a new SubscribeStream based on some options.
   * @param {Object} options The stream options to apply.
   */
  constructor(options = {}) {
    super(Object.assign(options, { keepSessionAlive: true })); // FIXME: Option not handled.

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
   * Returns an error message specifically for the given reference description.
   * @param {MappingItem} mappingItem The mappingItem to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(mappingItem) {
    return `Error reading node ${mappingItem.sourceNodeId.toString()}`;
  }

  /**
   * Monitors the nodes specified by the given {MappingItem}s.
   * @param {MappingItem} mappingItem The mappingItem to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  processChunk(mappingItem, handleErrors) {
    const nodeId = mappingItem.nodeId;

    if (!mappingItem.shouldBeRead) {
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
      return;
    }

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
        handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done()); // Ignore first notification
      } else {
        mappingItem.createConfigItemFromDataValue(dataValue);
        this.emit('change', mappingItem);
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
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error)} callback Called with the error that occured while trying to
   * monitor the given node.
   */
  _transform(desc, enc, callback) {
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

exports.SubscribeStream = SubscribeStream; /**
                                            * Watches the given nodes for value changes.
                                            * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
                                            */

class Watcher extends _events2.default {

  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = _ProjectConfig2.default.nodes) {
    super();

    /**
     * The browse stream that discovers the nodes to watch.
     * @type {BrowseStream}
     */
    this._browseStream = new _BrowseStream2.default(nodes).on('error', err => this.emit('error', err));

    /**
     * The stream that starts monitoring the nodes to watch.
     * @type {SubscribeStream}
     */
    this._subscribeStream = new SubscribeStream().on('error', err => this.emit('error', err));

    this._browseStream.pipe(this._subscribeStream);

    this._subscribeStream.on('finish', () => this.emit('ready'));
    this._subscribeStream.on('change', event => this.emit('change', event));
  }

  /**
   * Ends monitoring nodes.
   */
  close() {
    if (this._subscribeStream.session) {
      _Session.Session.close(this._subscribeStream.session).catch(err => this.emit('error', err));
    }
  }

}
exports.default = Watcher;
//# sourceMappingURL=Watcher.js.map