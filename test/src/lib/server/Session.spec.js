import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { StatusCodes } from 'node-opcua';
import { ClientSession, OPCUAClient } from 'node-opcua/lib/client/opcua_client';
import Logger from 'gulplog';
import expect from '../../../expect';
import Session from '../../../../src/lib/server/Session';
import ProjectConfig from '../../../../src/config/ProjectConfig';

function sessionWithLogin(login) {
  return proxyquire('../../../../src/lib/server/Session', {
    '../../config/ProjectConfig': {
      default: {
        host: ProjectConfig.host,
        port: ProjectConfig.port,
        login,
      },
    },
  }).default;
}

const FailingClientSession = proxyquire('../../../../src/lib/server/Session', {
  'node-opcua/lib/client/opcua_client': {
    OPCUAClient: class StubClient {

      connect(endpoint, cb) {
        cb(new Error('Client.create error'));
      }

    },
  },
}).default;

const FailingSession = proxyquire('../../../../src/lib/server/Session', {
  'node-opcua/lib/client/opcua_client': {
    OPCUAClient: class StubClient extends OPCUAClient {

      createSession(login, callback) {
        callback(new Error('Client.createSession error'));
      }

    },
  },
}).default;

/** @test {Session} */
describe('Session', function() {
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
        .then(session => expect(Session.close(session), 'to be fulfilled'));
    });

    it('should wait for session to close if already closing', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => {
          spy(session, 'close');
          return session;
        })
        .then(session => expect(Promise.all([
          Session.close(session),
          Session.close(session),
        ]), 'to be fulfilled'))
        .then(sessions => {
          expect(sessions, 'to have length', 2);
        });
    });

    it.skip('should warn if session does not exist', function() {
      const logListener = spy();
      Logger.on('debug', logListener);

      const session = new ClientSession();
      session._client = {
        closeSession(sess, del, callback) {
          const err = new Error();
          err.response = {
            responseHeader: {
              serviceResult: StatusCodes.BadSessionIdInvalid,
            },
          };

          callback(err);
        },
      };

      return expect(Session.close(session), 'to be fulfilled')
        .then(() => {
          expect(logListener, 'was called once');
          expect(logListener.lastCall, 'to satisfy', [/close a session that does not exist/]);
        });
    });

    it('should do nothing if client is not connected', function() {
      return expect(Session.create(), 'to be fulfilled')
        .then(session => new Promise((resolve, reject) => {
          session._client.disconnect(err => {
            if (err) {
              reject(err);
            } else {
              resolve(session);
            }
          });
        }))
        .then(session => expect(Session.close(session), 'to be fulfilled'));
    });

    it('should ignore errors closing session', function() {
      const session = new ClientSession();
      session._client = {
        closeSession(sess, del, callback) {
          callback(new Error('Test error'));
        },
        disconnect(cb) {
          cb();
        },
      };

      return expect(Session.close(session), 'to be fulfilled');
    });

    it('should ignore errors disconnecting client', function() {
      const session = new ClientSession();
      session._client = {
        closeSession(sess, del, callback) {
          callback(null);
        },
        disconnect(callback) {
          callback(new Error('Test client error'));
        },
      };

      return expect(Session.close(session), 'to be fulfilled');
    });
  });

  /** @test {Session.closeOpen} */
  describe('.closeOpen', function() {
    it('should return if no sessions are open', function() {
      return expect(Session.closeOpen(), 'to be fulfilled with', []);
    });

    it('should close open sessions', function() {
      expect(Session.open, 'to have length', 0);
      return expect(Session.create(), 'to be fulfilled')
        .then(session => expect(Session.closeOpen(), 'to be fulfilled with', [session]));
    });

    it('should wait for opening sessions to open before closing', function() {
      let session;
      Session.create().then(sess => (session = sess));

      return expect(Session.closeOpen(), 'to be fulfilled')
        .then(sessions => {
          expect(sessions, 'to equal', [session]);
        });
    });
  });
});
