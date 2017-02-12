import expect from 'unexpected';
import { spy } from 'sinon';

import { OPCUAClient, ClientSession } from 'node-opcua';
import Client, { _Client } from '../../../../src/lib/db/Client';
import Session from '../../../../src/lib/db/Session';
import TestConfig from '../../../fixtures/Atviseproject.babel';

/** @test {_Client} */
describe('_Client', function() {
  const validEndpoint = `opc.tcp://${TestConfig.host}:${TestConfig.port.opc}`;

  /** @test {_Client#constructor} */
  describe('#constructor', function() {
    it('should set isConnecting to false', function() {
      expect((new _Client()).isConnecting, 'to be', false);
    });

    it('should set connected to false', function() {
      expect((new _Client()).connected, 'to be', false);
    });
  });

  /** @test {_Client#connect} */
  describe('#connect', function() {
    it('should fail with invalid endpoint', function() {
      return expect((new _Client()).connect('opc.tcp//invalid.url:1234'),
        'to be rejected with', /^Invalid endpoint url/
      );
    });

    it('should emit `connect` event'  , function() {
      const listener = spy();
      const client = new _Client();
      client.on('connect', listener);

      return expect(client.connect(validEndpoint),
        'to be fulfilled',
      )
        .then(() => {
          expect(listener.calledOnce, 'to be', true);
        })
    });
  });

  /** @test {_Client#disconnect} */
  describe('#disconnect', function() {
    it('should set connected to false', function() {
      return expect((new _Client()).disconnect(),
        'to be fulfilled'
      )
        .then(client => expect(client.connected, 'to be', false));
    });
  });

  /** @test {_Client#createSession} */
  describe('#createSession', function() {
    it('should fail if client is not connected', function() {
      return expect((new _Client()).createSession(),
        'to be rejected with', 'Client is not connected');
    });
    
    it('should return a Session object', function() {
      return expect((new _Client()).connect(validEndpoint), 'to be fulfilled')
        .then(client => expect(client.createSession(), 'to be fulfilled'))
        .then(session => {
          expect(session, 'to be a', ClientSession);
          expect(session, 'to be a', Session);
        });
    });
  });

  /** @test {_Client#_removeSession} */
  describe('#_removeSession', function() {
    // If this test fails node-opcua's internal APIs may have changed
    it('should be called when a session is closed', function() {
      const client = new _Client();

      return expect(client.connect(validEndpoint),
        'to be fulfilled'
      )
        .then(client => {
          spy(client, '_removeSession');
        })
        .then(() => client.createSession())
        .then(session => session.close())
        .then(() => {
          expect(client._removeSession.calledOnce, 'to be', true);
        })
    });

    it('should disconnect client without any pending sessions', function() {
      let firstSession;
      const client = new _Client();

      return expect(client.connect(validEndpoint),
        'to be fulfilled'
      )
        .then(client => {
          spy(client, 'disconnect');
        })
        .then(() => client.createSession())
        .then(session => (firstSession = session))
        .then(() => client.createSession())
        .then(session => session.close())
        .then(() => { // One session still open, should not disconnect
          expect(client.disconnect.calledOnce, 'to be', false);
        })
        .then(() => firstSession.close())
        .then(() => { // All sessions closed, client should be disconnected
          expect(client.disconnect.calledOnce, 'to be', true);
        });
    });
  });
});

/** @test {Client} */
describe('Client', function() {
  /** @test {Client#constructor} */
  describe('#constructor', function() {
    it('should throw error', function() {
      expect(() => new Client(), 'to throw', /Use Client.shared instead/);
    });
  });

  /** @test {Client#disconnect} */
  describe('#disconnect', function() {
    it('should delete the shared instance', function() {
      let original;

      return expect(Client.shared(), 'to be fulfilled')
        .then(client => (original = client))
        .then(client => client.disconnect())
        .then(() => Client.shared())
        .then(client => {
          expect(client, 'not to be', original);
        })
    });
  });

  /** @test {Client.shared} */
  describe('.shared', function() {
    let client;

    afterEach(() => (client ? client.disconnect() : false));

    it('should connect and return an instance of node-opcua\'s OPCUAClient', function() {
      return expect(Client.shared().then(c => (client = c)),
        'when fulfilled', 'to be a', OPCUAClient);
    });

    it('should return the same instance if possible', function() {
      return Client.shared()
        .then(c => (client = c))
        .then(() => Client.shared())
        .then(second => expect(second, 'to equal', client));
    });

    it('should return a new instance if the shared one is disconnecting', function() {
      let first;

      return Client.shared()
        .then(c => (first = c))
        .then(() => first.disconnect())
        .then(() => Client.shared())
        .then(c => (client = c))
        .then(second => expect(second, 'not to equal', first));
    });

    it('should wait for the first to connect and return it to following requests', function() {
      return Promise.all([
        Client.shared().then(c => (client = c)),
        Client.shared(),
      ])
        .then(clients => {
          expect(clients, 'to have length', 2);
          expect(clients[0], 'to be a', _Client);
          expect(clients[0], 'to be', clients[1]);
        });
    });
  });
});
