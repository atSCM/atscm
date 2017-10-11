import Emitter from 'events';
import {
  ClientSubscription,
  AttributeIds,
  subscription_service as SubscriptionService,
  StatusCodes,
} from 'node-opcua';
import ProjectConfig from '../../config/ProjectConfig';
import BrowseStream from '../pull/BrowseStream';
import QueueStream from '../stream/QueueStream';
import Session from '../ua/Session';

/**
 * A stream that monitors changes in the read nodes.
 */
export class SubscribeStream extends QueueStream {

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
    const subscription = new ClientSubscription(this.session, {
      requestedPublishingInterval: 100,
      requestedLifetimeCount: 1000,
      requestedMaxKeepAliveCount: 12,
      maxNotificationsPerPublish: 10,
      publishingEnabled: true,
      priority: 10,
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
      handleErrors(null, StatusCodes.Good, done => done());
      return;
    }

    const item = this.subscription.monitor({
      nodeId,
      attributeId: AttributeIds.Value,
    }, {
      clientHandle: 13,
      samplingInterval: 250,
      queueSize: 1,
      discardOldest: true,
    }, SubscriptionService.TimestampsToReturn.Both);

    item.on('changed', dataValue => {
      if (!this._trackChanges) {
        handleErrors(null, StatusCodes.Good, done => done()); // Ignore first notification
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

/**
 * Watches the given nodes for value changes.
 * @emit {ReadStream.ReadResult} Emits `change` events when a watched node changes.
 */
export default class Watcher extends Emitter {

  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = ProjectConfig.nodes) {
    super();

    /**
     * The node stream that discovers the nodes to watch.
     * @type {NodeStream}
     */
    this._nodeStream = new NodeStream(nodes)
      .on('error', err => this.emit('error', err));

    /**
     * The stream that starts monitoring the nodes to watch.
     * @type {SubscribeStream}
     */
    this._subscribeStream = new SubscribeStream()
      .on('error', err => this.emit('error', err));

    this._nodeStream.pipe(this._subscribeStream);

    this._subscribeStream.on('finish', () => this.emit('ready'));
    this._subscribeStream.on('change', event => this.emit('change', event));
  }

  /**
   * Ends monitoring nodes.
   */
  close() {
    if (this._subscribeStream.session) {
      Session.close(this._subscribeStream.session)
        .catch(err => this.emit('error', err));
    }
  }

}
