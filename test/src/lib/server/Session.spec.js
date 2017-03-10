import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

import { ClientSession } from 'node-opcua';
import Session from '../../../../src/lib/server/Session';
import Client from '../../../../src/lib/server/Client';

function sessionWithLogin(login) {
  return proxyquire('../../../../src/lib/server/Session', {
    '../../config/ProjectConfig': {
      default: { login },
    },
  }).default;
}

const FailingClientSession = proxyquire('../../../../src/lib/server/Session', {
  './Client': {
    __esModule: true,
    default: class StubClient {
      static create() {
        return Promise.reject(new Error('Client.create error'));
      }
    },
  },
}).default;

const FailingSession = proxyquire('../../../../src/lib/server/Session', {
  './Client': {
    __esModule: true,
    default: class StubClient extends Client {
      static create() {
        return super.create()
          .then(client => {
            client.createSession = (login, callback) => {
              callback(new Error('Client.createSession error'));
            };

            return client;
          });
      }
    },
  },
}).default;

/** @test {Session} */
describe('Session', function() {
  this.timeout(5000);

  /** @test {Session.create} */
  describe('.create', function() {
    it('should create a new ClientSession', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          expect(session, 'to be a', ClientSession);
          return session;
        })
        .then(session => Session.close(session));
    });

    it('should store newly created session', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          expect(Session.open, 'to contain', session);
          return session;
        })
        .then(session => Session.close(session));
    });

    it('should fail with invalid credentials', function() {
      return Promise.all([
        // Missing username
        expect(sessionWithLogin({
          username: false,
          password: 'invalid password',
        }).create(), 'to be rejected with', /Invalid login/),

        // Missing password
        expect(sessionWithLogin({
          username: 'invalid username',
          password: false,
        }).create(), 'to be rejected with', /Invalid login/),

        // Invalid credentials
        expect(sessionWithLogin({
          username: 'invalid username',
          password: 'invalid password',
        }).create(), 'to be rejected with', /Invalid login/),
      ]);
    });

    it('should forward Client.create errors', function() {
      return expect(FailingClientSession.create(), 'to be rejected with', 'Client.create error');
    });

    it('should forward non-login errors', function() {
      return expect(FailingSession.create(), 'to be rejected with', /Client\.createSession error/);
    });
  });

  /** @test {Session.close} */
  describe('.close', function() {
    it('should fail without session', function() {
      return expect(() => Session.close(), 'to be rejected with', 'session is required');
    });

    it('should return if session is already closed', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => expect(Session.close(session), 'to be fulfilled'))
        .then(session => expect(Session.close(session), 'to be fulfilled'))
    });

    it('should wait for session to close if already closing', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          spy(session, 'close');

          return session;
        })
        .then(session => Promise.all([
          Session.close(session),
          Session.close(session),
        ]))
        .then(sessions => {
          expect(sessions, 'to have length', 2);
          expect(sessions[0], 'to be', sessions[1]);
          expect(sessions[0].close.calledOnce, 'to be true');
        });
    });

    it('should work if session is already closed', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          return new Promise((resolve) => {
            session._client.closeSession(session, true, err => {
              expect(err, 'to be falsy');
            });

            resolve(session);
          });
        })
        .then(session => expect(Session.close(session), 'to be fulfilled'));
    });
  });
});
