import expect from 'unexpected';
import proxyquire from 'proxyquire';

import { ClientSession } from 'node-opcua';
import Session from '../../../../src/lib/server/Session';
import TestConfig from '../../../fixtures/Atviseproject.babel';

function sessionWithLogin(login) {
  return proxyquire('../../../../src/lib/server/Session', {
    '../../config/ProjectConfig': {
      _esModule: true,
      default: { login },
    },
  }).default;
}

function itSkipForLocalTests(...args) {
  return process.env.TEST_LOCAL ? it.skip(...args) : it(...args);
}

/** @test {Session} */
describe('Session', function() {
  this.timeout(5000);

  /** @test {Session.create} */
  describe('.create', function() {
    it('should create a new ClientSession', function() {
      return expect(Session.create(), 'when fulfilled', 'to be a', ClientSession);
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
  });

  /** @test {Session.close} */
  describe('.close', function() {
    it('should fail without session', function() {
      return expect(() => Session.close(), 'to be rejected with', 'session is required');
    });
  });
});
