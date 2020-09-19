import { expectCorrectMapping } from '../../helpers/atscm';

describe('Issue #239 (https://github.com/atSCM/atscm/issues/239)', function () {
  context('Should not add empty newlines after pull and push', function () {
    expectCorrectMapping('issue-239', {
      path: 'AGENT.DISPLAYS',
      name: 'Issue-239',
    });
  });
});
