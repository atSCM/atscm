import { expectCorrectMapping } from '../../helpers/atscm';

describe.only('Issue #319 (https://github.com/atSCM/atscm/issues/319)', function() {
  context('Mapping relative node parameters', function() {
    expectCorrectMapping('issue-319', {
      path: 'AGENT.OBJECTS',
      name: 'Test-319',
    });
  });
});
