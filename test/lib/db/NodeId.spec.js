import expect from 'unexpected';

import { NodeId as OpcNodeId } from 'node-opcua';
import NodeId from '../../../src/lib/db/NodeId';

/** @test {NodeId} */
describe('NodeId', function() {
  const path = 'AGENT/DISPLAYS/Main';
  const id = 'AGENT.DISPLAYS.Main';

  /** @test {NodeId#constructor} */
  describe('#constructor', function() {
    function expectType(type, ...args) {
      expect((new NodeId(...args)).identifierType, 'to equal', type);
    }

    context('when called with value only', function() {
      it('should work', function() {
        expect(() => new NodeId('AGENT.DISPLAYS'), 'not to throw');
      });

      it('should set namespace to 1', function() {
        expect((new NodeId('AGENT.DISPLAYS')).namespace, 'to equal', 1);
      });

      it('should set indentifierType to string if string is passed', function() {
        expectType(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS');
      });

      it('should set indentifierType to number if number is passed', function() {
        expectType(NodeId.NodeIdType.NUMERIC, 123);
      });
    });

    context('when called with a nodeid string', function() {
      it('should work', function() {
        expect(() => new NodeId('ns=1;s=AGENT.DISPLAYS'), 'not to throw');
      });

      it('should get namespace from string', function() {
        expect((new NodeId('ns=13;s=AGENT.DISPLAYS')).namespace, 'to equal', 13);
      });

      it('should get identifierType from string', function() {
        expectType(NodeId.NodeIdType.STRING, 'ns=1;s=AGENT.DISPLAYS');
        expectType(NodeId.NodeIdType.NUMERIC, 'ns=1;i=13');
        // FIXME: Missing tests for type GUID
        expectType(NodeId.NodeIdType.BYTESTRING, 'ns=1;b=13Ac');
      });
    });

    context('when called with type, value, namespace', function() {
      it('should work', function() {
        expect(() => new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS', 1), 'not to throw');
      });

      it('should set namespace to 1 if omitted', function() {
        expect(() => new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS'), 'not to throw');
        expect((new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS')).namespace, 'to equal', 1);
      });
    });

    it('should extend node-opcua\'s NodeId', function() {
      expect((new NodeId(NodeId.NodeIdType.NUMERIC, 123, 1)), 'to be a', OpcNodeId);
    });
  });
});
