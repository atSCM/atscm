/* eslint-plugin-jsdoc does not recognize the "emits" tag */
/* eslint-disable jsdoc/check-tag-names */

/* Needed as long as https://github.com/gajus/eslint-plugin-jsdoc/issues/56 is open */
/* eslint-disable jsdoc/check-param-names */

import Emitter from 'events';
import { ClientSubscription } from 'node-opcua/lib/client/client_subscription';
import { AttributeIds } from 'node-opcua/lib/services/read_service';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import { reportProgress } from '../helpers/log';
import Session from './Session';
import NodeBrowser from './NodeBrowser';

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
        /** The current session, if connected @type {Session} */
        this._session = session;

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

        try {
          item.terminate();
        } catch (e) {
          Logger.warn('Failed to terminate subscription', e);
        }

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
    })
      .catch(err => { throw Object.assign(err, { node }); });
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
    if (this._session) {
      Session.close(this._session)
        .catch(err => this.emit('error', err));
    }
  }

}
