import { expectCorrectMapping } from '../../helpers/atscm';

describe('push task', function() {
  context('when pushing SMTP servers', function() {
    expectCorrectMapping('issue-170/smtp-server', {
      path: 'AGENT.SMTPSERVERS',
      name: 'TestSMTPServer',
    });
  });
});
