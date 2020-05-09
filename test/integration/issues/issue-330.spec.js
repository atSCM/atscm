import expect from '../../expect';
import { importSetup, pull, deleteNode } from '../../helpers/atscm';
import { tmpDir } from '../../helpers/util';

describe('Issue #330 (https://github.com/atSCM/atscm/issues/330)', function() {
  const originalNames = ['Header'];
  const nodePaths = ['AGENT.DISPLAYS.HEADER'];

  function getNodeIds(nodeNames) {
    return nodeNames.map((nodeName, i) => {
      const path = nodePaths[i];
      const divider = path.match(/RESOURCES/) ? '/' : '.';
      return `${path}${divider}${nodeName}`;
    });
  }

  context('when pulling XML with `>` in attribute value', function() {
    const setup = 'issue-330/original';
    let nodeNames;
    let nodeIds;
    let destination;

    before('Import setup', async function() {
      nodeNames = await importSetup(setup, ...originalNames);
      nodeIds = getNodeIds(nodeNames);
      destination = tmpDir(setup.replace(/\//g, '-'));
    });

    it('should not error', function() {
      return expect(
        pull(nodeIds.map(nodeId => `ns=1;s=${nodeId}`), destination),
        'to be fulfilled'
      );
    });

    after('delete tmp node', function() {
      // Delete the pushed node
      return Promise.all(nodeIds.map(n => deleteNode(n)));
    });
  });

  context('when attribute is renamed', function() {
    const setup = 'issue-330/fixed';
    let nodeNames;
    let nodeIds;
    let destination;

    before('Import setup', async function() {
      nodeNames = await importSetup(setup, ...originalNames);
      nodeIds = getNodeIds(nodeNames);
      destination = tmpDir(setup.replace(/\//g, '-'));
    });

    it('should not error', function() {
      return expect(
        pull(nodeIds.map(nodeId => `ns=1;s=${nodeId}`), destination),
        'to be fulfilled'
      );
    });

    after('delete tmp node', function() {
      // Delete the pushed node
      return Promise.all(nodeIds.map(n => deleteNode(n)));
    });
  });
});
