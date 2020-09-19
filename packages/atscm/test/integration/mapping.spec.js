import { expectCorrectMapping } from '../helpers/atscm';

describe('Mapping', function () {
  context.skip('when resource directory with dot in name', function () {
    expectCorrectMapping('mapping/dot-in-dirname', {
      path: 'SYSTEM.LIBRARY.PROJECT.RESOURCES/DataTables/Bootstrap-4-4.0.0/css',
      name: 'bootstrap.min.css',
    });
  });

  context('a display containing a folder', function () {
    expectCorrectMapping('mapping/folder-in-display', {
      path: 'AGENT.DISPLAYS',
      name: 'FolderInDisplay',
    });
  });

  context('a display containing a display with the same name', function () {
    expectCorrectMapping('mapping/child-display-with-same-name', {
      path: 'AGENT.DISPLAYS',
      name: 'ChildWithSameName',
    });
  });

  context('a variable array', function () {
    expectCorrectMapping('mapping/test-array-values', {
      path: 'AGENT.OBJECTS',
      name: 'InvalidArrayValue',
    });
  });

  context('a 64bit variable value', function () {
    expectCorrectMapping('mapping/int64', {
      path: 'AGENT.OBJECTS',
      name: 'TestCreateInt64',
    });
  });

  context('a node with a historical configuration', function () {
    expectCorrectMapping('mapping/historical-config', {
      path: 'AGENT.OBJECTS',
      name: 'TestHistoryConfig',
    });
  });
});
