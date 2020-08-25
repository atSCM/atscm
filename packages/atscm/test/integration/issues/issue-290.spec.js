import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #290 (https://github.com/atSCM/atscm/issues/290)', function() {
  context('User group references should be mapped correctly', function() {
    expectCorrectMapping('issue-290', {
      path: 'SYSTEM',
      name: 'SECURITY-Test',
    });
  });
});
