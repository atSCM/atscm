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
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import { reportProgress } from '../helpers/log';
import QueueStream from './QueueStream';
import Session from './Session';
import NodeBrowser from './NodeBrowser';

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
    const nodeId = referenceDescription.id;

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
     * The browser used to subscribe to server nodes.
     * @type {NodeBrowser}
     */
    this._nodeBrowser = new NodeBrowser({
      handleNode: this._subscribe.bind(this),
    });

    reportProgress(this._nodeBrowser.browse(nodes), {
      getter: () => this._nodeBrowser._pushed,
      formatter: count => `Subscribed to ${count} nodes`,
    })
      .then(() => this.emit('ready'))
      .catch(err => this.emit('error', err));

    /**
     * Resolved once the server subscription is set up.
     * @type {Promise<any>}
     */
    this.subscriptionStarted = this._setupSubscription()
      .catch(err => this.emit('error', err));
  }

  /**
   * Initializes a server subscription.
   * @return {Promise<node-opcua~ClientSubscription>} A setup subscription.
   */
  _setupSubscription() {
    return Session.create()
      .then(session => new Promise((resolve, reject) => {
        const subscription = new ClientSubscription(session, {
          requestedPublishingInterval: 100,
          requestedLifetimeCount: 1000,
          requestedMaxKeepAliveCount: 12,
          maxNotificationsPerPublish: 10,
          publishingEnabled: true,
          priority: 10,
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
    if (node.nodeClass !== NodeClass.Variable) { return undefined; }
    const subscription = await this.subscriptionStarted;

    const nodeId = node.id;

    const item = subscription.monitor({
      nodeId,
      attributeId: AttributeIds.Value,
    }, {
      clientHandle: 13,
      samplingInterval: 250,
      queueSize: 123,
      discardOldest: true,
    });

    return new Promise((resolve, reject) => {
      // Sometimes the changed event is not emitted...
      // Fixes #202
      const timeout = setTimeout(() => {
        Logger.debug(`Error monitoring '${nodeId.value}': Did not receive initial value. Retry...`);
        item.terminate();
        return this._subscribe(node).then(resolve, reject);
      }, 1000);

      item.once('changed', () => {
        clearTimeout(timeout);
        item.on('changed', this._handleChange.bind(this, {
          nodeId,
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
  _handleChange({ nodeId }, dataValue) {
    this.emit(dataValue.value ? 'change' : 'delete', {
      // nodeClass,
      nodeId,
      value: dataValue.value,
      mtime: dataValue.serverTimestamp,
    });
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
