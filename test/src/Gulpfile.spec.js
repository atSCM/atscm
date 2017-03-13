import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

import * as tasks from '../../src/Gulpfile';

describe('Gulpfile', function() {
  it('should export description for all tasks', function() {
    Object.keys(tasks).forEach(name => {
      const desc = tasks[name].description;

      expect(desc, 'to be defined');
      expect(desc, 'not to be empty');
    });
  });

  it('should register cleanupHandler', function() {
    const nodeCleanup = spy();

    const orgLog = console.log;
    process.env.NODE_ENV = 'production';
    proxyquire('../../src/Gulpfile', {
      'node-cleanup': nodeCleanup,
    });
    process.env.NODE_ENV = 'test';
    console.log = orgLog;

    expect(nodeCleanup.calledOnce, 'to be', true);
  });
});
