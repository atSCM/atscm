import { expectCorrectMapping } from '../../helpers/atscm';

describe('push task', function() {
  context('when pushing SMTP servers', function() {
    expectCorrectMapping('issue-170/smtp-server', {
      path: 'AGENT.SMTPSERVERS',
      name: 'TestSMTPServer',
    });
  });

  context('when pushing node with alarm configuration', function() {
    expectCorrectMapping('issue-170/node-with-alarmconfig', {
      path: 'AGENT.OBJECTS',
      name: 'TestWithAlarmConfig',
    });
  });

  context('when pushing webserver with protected call', function() {
    expectCorrectMapping('issue-170/webserver-with-protectedcall', {
      path: 'AGENT.WEBACCESS',
      name: 'http2',
    });
  });
});
