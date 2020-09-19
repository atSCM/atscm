import Logger from 'gulplog';
import { spy } from 'sinon';
import { readdir } from 'fs-extra';
import expect from '../../expect';
import { tmpDir } from '../../helpers/util';
import { importSetup, pull, deleteNode } from '../../helpers/atscm';

describe('Issue #345 (https://github.com/atSCM/atscm/issues/345)', function () {
  const setup = 'issue-345';
  let nodeIds;

  it('pull should not error on empty script', async function () {
    const nodeNames = await importSetup(setup, 'EmptyScript');
    const nodePaths = ['SYSTEM.LIBRARY.PROJECT.MENUSCRIPTS'];
    nodeIds = nodeNames.map((nodeName, i) => {
      const path = nodePaths[i];
      const divider = path.match(/RESOURCES/) ? '/' : '.';
      return `${path}${divider}${nodeName}`;
    });
    const destination = tmpDir(setup.replace(/\//g, '-'));

    const warnSpy = spy();
    Logger.on('warn', warnSpy);

    // Run atscm pull
    await pull(
      nodeIds.map((nodeId) => `ns=1;s=${nodeId}`),
      destination
    );

    // No files should be pulled, ...
    await expect(() => readdir(destination), 'to be rejected with', { code: 'ENOENT' });

    // ... instead, a warning should be displayed
    expect(warnSpy, 'was called once');
    return expect(warnSpy, 'to have a call satisfying', { args: [/is empty/] });
  });

  after(() => nodeIds.forEach((id) => deleteNode(id)));
});
