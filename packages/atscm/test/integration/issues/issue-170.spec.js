import { expectCorrectMapping } from '../../helpers/atscm';

describe.skip('push task', function () {
  context('when pushing SMTP servers', function () {
    expectCorrectMapping('issue-170/smtp-server', {
      path: 'AGENT.SMTPSERVERS',
      name: 'TestSMTPServer',
    });
  });

  context('when pushing node with alarm configuration', function () {
    expectCorrectMapping('issue-170/node-with-alarmconfig', {
      path: 'AGENT.OBJECTS',
      name: 'TestWithAlarmConfig',
    });
  });

  // NOTE: This only works on atvise server 3+
  context('when pushing webserver with protected call', function () {
    expectCorrectMapping('issue-170/webserver-with-protectedcall', {
      path: 'AGENT.WEBACCESS',
      name: 'http2',
    });
  });

  context('when pushing archives with partition interval and file limit', function () {
    expectCorrectMapping('issue-170/archive-interval-filelimit', {
      path: 'AGENT.HISTORY',
      name: 'TestArchive',
    });
  });

  context('when pushing aggregate templates and functions', function () {
    expectCorrectMapping('issue-170/aggregate-template', {
      path: 'AGENT.HISTORY.AGGREGATETEMPLATES',
      name: 'TestAggregateTemplate',
    });
  });

  context('when pushing custom alarm category', function () {
    expectCorrectMapping('issue-170/alarm-category', {
      path: 'SYSTEM.LIBRARY.PROJECT.ALARMCATEGORIES',
      name: 'TestAlarmCategory',
    });
  });

  context('when pushing custom user groups', function () {
    expectCorrectMapping('issue-170/user-and-group', {
      path: ['SYSTEM.SECURITY.GROUPS', 'SYSTEM.SECURITY.USERS'],
      name: ['TestGroup', 'TestUser'],
    });
  });

  context('when pushing serverscripts in redundant project', function () {
    expectCorrectMapping('issue-170/redundancy-serverscript', {
      path: 'SYSTEM.LIBRARY.PROJECT.SERVERSCRIPTS',
      name: 'LongRunningScript',
    });
  });

  context('when pushing resources with compress properties', function () {
    expectCorrectMapping('issue-170/compressed-node', {
      path: 'SYSTEM.LIBRARY.PROJECT.RESOURCES',
      name: 'CompressedNode.html',
    });
  });
});
