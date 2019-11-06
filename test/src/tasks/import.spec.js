import { basename } from 'path';
import { read_service as ReadService } from 'node-opcua';
import scriptFiles from '@atscm/server-scripts';
import expect from '../../expect';
import importTask from '../../../src/tasks/import';
import Session from '../../../src/lib/server/Session';

/** @test {importTask} */
describe('importTask', function() {
  it.skip('should import all scripts', async function() {
    const startTime = Date.now();

    await expect(importTask(), 'to yield objects satisfying', []);

    const base = 'ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm';

    const session = await Session.create();
    const scriptNames = scriptFiles.map(s => basename(s, '.xml'));

    const results = await expect(
      cb =>
        session.read(
          scriptNames.map(script => ({
            nodeId: `${base}.${script}`,
            attributeId: ReadService.AttributeIds.ServerTimestamp,
          })),
          cb
        ),
      'to call the callback without error'
    ).then(all => all[1]);

    return expect(results.map(r => r.serverTimestamp), 'to have items satisfying', item => {
      expect(item, 'to be a', Date);
      expect(item.valueOf(), 'to be greater than or equal to', startTime);
    });
  });
});
