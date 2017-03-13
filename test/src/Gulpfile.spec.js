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

    process.env.NODE_ENV = 'production';
    proxyquire('../../src/Gulpfile', {
      'node-cleanup': nodeCleanup,
    });
    process.env.NODE_ENV = 'test';

    expect(nodeCleanup.calledOnce, 'to be', true);
  });
});
