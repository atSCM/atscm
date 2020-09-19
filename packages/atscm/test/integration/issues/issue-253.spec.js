import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #253 (https://github.com/atSCM/atscm/issues/253)', function() {
  context('Umlauts should be mapped correctly after pull and push', function() {
    expectCorrectMapping('issue-253', {
      path: 'AGENT.DISPLAYS',
      name: 'Issue-253',
    });
  });
});
