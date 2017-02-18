import expect from 'unexpected';
import { spy } from 'sinon';

import { NodeId as OpcNodeId } from 'node-opcua';
import NodeId from '../../../../src/lib/server/NodeId';

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

  /** @test {NodeId#fromFilePath} */
  describe.skip('#fromFilePath', function() {
    it('should return a NodeId', function() {
      expect(NodeId.fromFilePath(path), 'to be a', NodeId);
    });

    it('should return file path again', function() {
      const nodeId = NodeId.fromFilePath(path);
      expect(nodeId.filePath, 'to be a', 'string');
      expect(nodeId.filePath, 'to equal', path);
    });
  });

  /** @test {NodeId#filePath} */
  describe('#filePath', function() {
    it('should return a valid file path', function() {
      const nodeId = new NodeId(NodeId.NodeIdType.STRING, id, 1);

      expect(nodeId.filePath, 'to be a', 'string');
      expect(nodeId.filePath, 'to equal', path);
    });

    it('should handle resource paths', function() {
      const nodeId = new NodeId(NodeId.NodeIdType.STRING, 'SYSTEM.LIBRARY.RESOURCES/dir/test.ext', 1);

      expect(nodeId.filePath, 'to be a', 'string');
      expect(nodeId.filePath, 'to equal', 'SYSTEM/LIBRARY/RESOURCES/dir/test.ext');
    });
  });

  /** @test {NodeId#inspect} */
  describe('#inspect', function() {
    const opts = {
      stylize: spy(t => t),
    };

    beforeEach(() => opts.stylize.reset());

    it('should return "namespace value"', function() {
      const nodeId = new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS', 1);

      expect(nodeId.inspect(0, opts), 'to match', /1 AGENT\.DISPLAYS/);
    });

    it('should style string id as string', function() {
      (new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS', 1)).inspect(0, opts);

      expect(opts.stylize.calledTwice, 'to be true');
      expect(opts.stylize.lastCall.args, 'to equal', ['AGENT.DISPLAYS', 'string']);
    });

    it('should style numeric id as number', function() {
      (new NodeId(NodeId.NodeIdType.NUMERIC, 123, 1)).inspect(0, opts);

      expect(opts.stylize.calledTwice, 'to be true');
      expect(opts.stylize.lastCall.args, 'to equal', [123, 'number']);
    });
  });
});
