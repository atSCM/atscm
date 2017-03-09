import Session from '../../src/lib/server/Session';

process.on('unhandledRejection', e => {
  process.emit('error', e);
});

after(function() {
  this.timeout(5000);

  console.log('Maintenance: Closing open sessions');

  return Session.closeOpen()
    .then(results => console.log('Maintenance: Closed', results.length, 'open session'));
});
