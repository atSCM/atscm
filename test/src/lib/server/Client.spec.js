import expect from 'unexpected';
import proxyquire from 'proxyquire';

import { OPCUAClient } from 'node-opcua';
import Client from '../../../../src/lib/server/Client';

const InvalidHostClient = proxyquire('../../../../src/lib/server/Client', {
  '../../config/ProjectConfig': {
    default: {
      host: 'in valid url',
      port: { opc: 4840 },
    },
  },
}).default;

const NotExisingHostClient = proxyquire('../../../../src/lib/server/Client', {
  '../../config/ProjectConfig': {
    default: {
      host: '123.456.789.0',
      port: { opc: 4840 },
    },
  },
}).default;

const FailingClient = proxyquire('../../../../src/lib/server/Client', {
  'node-opcua': {
    OPCUAClient: class FailingCli extends OPCUAClient {

      connect(endpoint, callback) {
        callback(new Error('Error message'))
      }

    }
  },
}).default;

/** @test {Client} */
describe('Client', function() {
  this.timeout(5000);

  /** @test {Client.create} */
  describe('.create', function() {
    it('should return a OPCUAClient', function() {
      return expect(Client.create(), 'when fulfilled', 'to be a', OPCUAClient);
    });

    it('should fail with invalid host', function() {
      return expect(InvalidHostClient.create(), 'to be rejected with', /Invalid endpoint url/);
    });

    it('should fail on connection timeout', function() {
      return expect(NotExisingHostClient.create(), 'to be rejected with', /Connection timed out/);
    });

    it('should fail when node-opcua encounters an error', function() {
      return expect(FailingClient.create(), 'to be rejected with', Error);
    });
  });
});
