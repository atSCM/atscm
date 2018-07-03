/* eslint-plugin-jsdoc does not recognize the "emits" tag */
/* eslint-disable jsdoc/check-tag-names */

/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */

import Emitter from 'events';
import { ClientSubscription } from 'node-opcua/lib/client/client_subscription';
import { AttributeIds } from 'node-opcua/lib/services/read_service';
import SubscriptionService from 'node-opcua/lib/services/subscription_service';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import ProjectConfig from '../../config/ProjectConfig';
import NodeStream from './NodeStream';
import QueueStream from './QueueStream';
import Session from './Session';

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
    const nodeId = referenceDescription.nodeId;

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
        this.emit(dataValue.value ? 'change' : 'delete', {
          nodeClass: referenceDescription.nodeClass,
          nodeId,
          value: dataValue.value,
          references: referenceDescription.references,
          mtime: dataValue.serverTimestamp,
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
    if (desc.nodeClass !== NodeClass.Variable) {
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
export default class Watcher extends Emitter {

  /**
   * Creates a new Watcher with the given nodes.
   * @param {NodeId[]} nodes The nodes to watch (recursively).
   */
  constructor(nodes = ProjectConfig.nodesToWatch) {
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

    // "pipe" subscribe stream
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
      Session.close(this._subscribeStream.session)
        .catch(err => this.emit('error', err));
    }
  }

}
