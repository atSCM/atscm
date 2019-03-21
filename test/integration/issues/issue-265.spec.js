import Logger from 'gulplog';
import { outputJson, readJson } from 'fs-extra';
import expect from '../../expect';
import { importSetup, pull, deleteNode } from '../../helpers/atscm';
import { tmpDir } from '../../helpers/util';

describe('Issue #265 (https://github.com/atSCM/atscm/issues/265)', function() {
  const renamePath = './atscm/rename.json';
  const setup = 'issue-265';
  const originalName = 'conflicting-nodes';

  let nodeIds;

  const catchErrorLog = () => {};

  before('reset renames, import setup and pull conflicting nodes', async function() {
    Logger.on('error', () => catchErrorLog);
    await outputJson(renamePath, {});

    const nodeNames = await importSetup(setup, originalName);
    const nodePaths = ['AGENT.OBJECTS'];
    nodeIds = nodeNames.map((nodeName, i) => `${nodePaths[i]}.${nodeName}`);
    const destination = tmpDir(setup.replace(/\//g, '-'));

    await pull(nodeIds.map(nodeId => `ns=1;s=${nodeId}`), destination);
  });

  it('should not create duplicate entries in rename.json', async function() {
    const renames = await readJson(renamePath);

    expect(Object.keys(renames), 'to equal', [
      `${nodeIds[0]}.Parent`,
    ]);
  });

  after('delete tmp node', function() {
    Logger.off('error', () => catchErrorLog);

    // Delete the pushed node
    return Promise.all(nodeIds.map(n => deleteNode(n)));
  });
});
