import { expectCorrectMapping } from '../helpers/atscm';

describe.skip('Mapping', function() {
  context('when resource directory with dot in name', function() {
    expectCorrectMapping('mapping/dot-in-dirname', {
      path: 'SYSTEM.LIBRARY.PROJECT.RESOURCES/DataTables/Bootstrap-4-4.0.0/css',
      name: 'bootstrap.min.css',
    });
  });
});
