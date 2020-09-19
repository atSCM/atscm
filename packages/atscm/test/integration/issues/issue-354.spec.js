import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #354 (https://github.com/atSCM/atscm/issues/354)', function() {
  context('Object type modelling rules', function() {
    expectCorrectMapping('issue-354', {
      path: ['ObjectTypes.PROJECT', 'ObjectTypes.PROJECT'],
      name: ['MyObjectType1', 'MyObjectType2'],
    });
  });
});
