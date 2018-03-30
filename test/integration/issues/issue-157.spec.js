import { DataType } from 'node-opcua';
import watch from '../../../src/tasks/watch';
import { importSetup, callScript } from '../../helpers/atscm';

describe('watch task', function() {
  context('when a watched node is deleted', function() {
    it('should not error', async function() {
      const nodeName = await importSetup('issue-157', 'DeleteDisplay');
      const nodeId = `AGENT.DISPLAYS.${nodeName}`;

      // Start watch task
      await watch({ open: false });

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
