import { DataType } from 'node-opcua';
import watch from '../../../src/tasks/watch';
import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #345 (https://github.com/atSCM/atscm/issues/345)', function() {
  context('pull should not error on empty script', function() {
    expectCorrectMapping('issue-345', {
      path: 'SYSTEM.LIBRARY.PROJECT.MENUSCRIPTS',
      name: 'EmptyScript',
    });
  });
});
