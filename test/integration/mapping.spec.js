import { expectCorrectMapping } from '../helpers/atscm';

describe('Mapping', function() {
  context.skip('when resource directory with dot in name', function() {
    expectCorrectMapping('mapping/dot-in-dirname', {
      path: 'SYSTEM.LIBRARY.PROJECT.RESOURCES/DataTables/Bootstrap-4-4.0.0/css',
      name: 'bootstrap.min.css',
    });
  });

  context('a display containing a folder', function() {
    expectCorrectMapping('mapping/folder-in-display', {
      path: 'AGENT.DISPLAYS',
      name: 'FolderInDisplay',
    });
  });
});
