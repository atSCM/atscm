import { DataType } from 'node-opcua';
import watch from '../../../src/tasks/watch';
import { importSetup, callScript } from '../../helpers/atscm';

describe('watch task', function() {
  context('when a watched node is deleted', function() {
    it('should not error', async function() {
      const nodeName = await importSetup('issue-157', 'DeleteDisplay');
      const nodeId = `AGENT.DISPLAYS.${nodeName}`;

      // Start watch task
      const { serverWatcher } = await watch({ open: false });

      // Wait until deletion is recognized
      const isTestNode = r => r.nodeId.value.split(nodeId).length > 1;
      const changeCalled = new Promise((resolve, reject) => {
        serverWatcher.on('change', r => {
          if (isTestNode(r)) { reject(); }
        });

        serverWatcher.on('delete', r => {
          if (isTestNode(r)) { resolve(); }
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Delete the node
      await callScript('DeleteNode', {
        nodeId: {
          dataType: DataType.String,
          value: nodeId,
        },
      });

      return changeCalled;
    });
  });
});