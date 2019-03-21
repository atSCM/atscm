import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #276 (https://github.com/atSCM/atscm/issues/276)', function() {
  context('Modelling rule should be mapped correctly', function() {
    expectCorrectMapping('issue-276', {
      path: 'ObjectTypes.PROJECT',
      name: 'OT',
    });
  });
});
