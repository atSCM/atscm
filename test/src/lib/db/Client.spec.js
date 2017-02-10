import expect from 'unexpected';

import { OPCUAClient } from 'node-opcua';
import Client from '../../../../src/lib/db/Client';

/** @test {Client} */
describe('Client', function() {
  /** @test {Client#constructor} */
  describe('#constructor', function() {
    it('should throw error', function() {
      expect(() => new Client(), 'to throw', /Use Client.shared instead/);
    });
  });

  /** @test {Client.shared} */
  describe('.shared', function() {
    it('should connect and return an instance of node-opcua\'s OPCUAClient', function() {
      return expect(Client.shared(), 'when fulfilled', 'to be a', OPCUAClient);
    });

    it('should return the same instance every time', function() {
      return expect(Promise.all([
        Client.shared(),
        Client.shared(),
      ]), 'to be fulfilled')
        .then(clients => {
          expect(clients, 'to have length', 2);
          expect(clients[0], 'to be', clients[1]);
        });
    });
  });
});
