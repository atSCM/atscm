import { DataType } from 'node-opcua';
import watch from '../../../src/tasks/watch';
import { importSetup, callScript } from '../../helpers/atscm';

describe('watch task', function() {
  context('when a watched node is deleted', function() {
    it('should not error', async function(cb) {
      const nodeName = await importSetup('issue-157', 'DeleteDisplay');
      const nodeId = `AGENT.DISPLAYS.${nodeName}`;

      // Start watch task
      const { serverWatcher } = await watch({ open: false });

      // Wait until deletion is recognized
      serverWatcher.on('change', r => {
        if (r.nodeId.value.split(nodeId).length > 1) {
          cb();
        }
      });

      // Delete the node
      await callScript('DeleteNode', {
        nodeId: {
          dataType: DataType.String,
          value: nodeId,
        },
      });
    });
  });
});
