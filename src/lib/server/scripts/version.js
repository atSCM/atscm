/* eslint-disable import/prefer-default-export */

import NodeId from '../../model/opcua/NodeId';

/**
 * The node containing the currently installed server-scripts version.
 * @type {NodeId}
 */
export const versionNode = new NodeId('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.version');
