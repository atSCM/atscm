import Session from '../../src/lib/server/Session';

process.on('unhandledRejection', (e) => {
  process.emit('error', e);
});

beforeEach(function () {
  return Session.closeOpen().then((results) => {
    if (results.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Maintenance: Closed', results.length, 'open session');
    }
  });
});
