import expect from 'unexpected';

import Session from '../../../../src/lib/db/Session';

/** @test {Session} */
describe('Session', function() {
  /** @test {Session#close} */
  describe('#close', function() {
    it('should fail if called multiple times', function() {
      return expect(
        expect(Session.create(), 'to be fulfilled')
          .then(session => session.close())
          .then(session => session.close()),
        'to be rejected with', 'no channel');

    });
  });

  /** @test {Session.create} */
  describe('.create', function() {
    it('should return a Session instance', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          expect(session, 'to be a', Session);

          return session.close();
        });
    });
  });
});
