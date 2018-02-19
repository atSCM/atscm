import { join } from 'path';
import expect from 'unexpected';
import { spy } from 'sinon';
import { NodeId as OpcNodeId } from 'node-opcua';
import NodeId from '../../../../../src/lib/model/opcua/NodeId';

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
  describe('#fromFilePath', function() {
    it('should return a NodeId', function() {
      expect(NodeId.fromFilePath(path), 'to be a', NodeId);
    });

    it('should return file path again', function() {
      const nodeId = NodeId.fromFilePath(path);
      expect(nodeId.filePath, 'to be a', 'string');
      expect(nodeId.filePath, 'to equal', path);
    });

    it('should work with resource paths', function() {
      expect(NodeId.fromFilePath(
        join('SYSTEM/LIBRARY/ATVISE/RESOURCES/timer/imgs_glossy/top-separator.gif')
      ).value,
      'to equal', 'SYSTEM.LIBRARY.ATVISE.RESOURCES/timer/imgs_glossy/top-separator.gif');
    });

    it('should work with multi extension resource paths', function() {
      expect(NodeId.fromFilePath(
        join('SYSTEM/LIBRARY/PROJECT/RESOURCES/styles/bootstrap.min.css')
      ).value,
      'to equal', 'SYSTEM.LIBRARY.PROJECT.RESOURCES/styles/bootstrap.min.css');
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
      const nodeId = new NodeId(NodeId.NodeIdType.STRING, 'SYSTEM.LIBRARY.RESOURCES/dir/test.e', 1);

      expect(nodeId.filePath, 'to be a', 'string');
      expect(nodeId.filePath, 'to equal', 'SYSTEM/LIBRARY/RESOURCES/dir/test.e');
    });
  });

  /** @test {_lastSeparator} */
  describe('#_lastSeparator', function() {
    it('should return null for non-string node ids', function() {
      expect(new NodeId(NodeId.NodeIdType.NUMERIC, 123, 1)._lastSeparator, 'to be', null);
    });

    it('should return `/` for resource paths', function() {
      expect(new NodeId(NodeId.NodeIdType.STRING, 'Test/Resource', 1)._lastSeparator, 'to be', '/');
    });

    it('should return `.` for regular node ids', function() {
      expect(new NodeId(NodeId.NodeIdType.STRING, 'Test.Node', 1)._lastSeparator, 'to be', '.');
    });
  });

  /** @test {NodeId#parent} */
  describe('#parent', function() {
    it('should return null for non-string node ids', function() {
      const child = new NodeId(NodeId.NodeIdType.NUMERIC, 123, 1);
      const parent = child.parent;

      expect(parent, 'to be', null);
    });

    it('should inherit identifier type', function() {
      const child = new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS.Main', 13);
      const parent = child.parent;

      expect(parent.identifierType, 'to equal', NodeId.NodeIdType.STRING);
    });

    it('should inherit namespace', function() {
      const child = new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS.Main', 13);
      const parent = child.parent;

      expect(parent.namespace, 'to equal', 13);
    });

    it('should return parent nodes for dot separated node ids', function() {
      const child = new NodeId(NodeId.NodeIdType.STRING, 'AGENT.DISPLAYS.Main', 13);
      const parent = child.parent;

      expect(parent.value, 'to equal', 'AGENT.DISPLAYS');
    });

    it('should return parent nodes for slash separated node ids', function() {
      const child = new NodeId(NodeId.NodeIdType.STRING, 'SYSTEM.LIBRARY.RESOURCES/dir/test.e', 13);
      const parent = child.parent;

      expect(parent.value, 'to equal', 'SYSTEM.LIBRARY.RESOURCES/dir');
    });
  });

  /** @test {NodeId#isChildOf} */
  describe('#isChildOf', function() {
    it('should return false for non-string ids', function() {
      const invalid = new NodeId(NodeId.NodeIdType.NUMERIC, 123, 13);
      const valid = new NodeId(NodeId.NodeIdType.STRING, 'Node.Path', 13);

      expect(invalid.isChildOf(valid), 'to be false');
      expect(valid.isChildOf(invalid), 'to be false');
    });

    it('should return false for different namespaces', function() {
      const first = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node', 1);
      const second = new NodeId(NodeId.NodeIdType.STRING, 'Path.To', 2);

      expect(first.isChildOf(second), 'to be false');
    });

    it('should return false for same nodes values', function() {
      const first = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node', 1);
      const second = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node', 1);

      expect(first.isChildOf(second), 'to be false');
    });

    it('should return false for similar node values', function() {
      const base = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node', 1);
      const postfixed = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node1', 1);
      const prefixed = new NodeId(NodeId.NodeIdType.STRING, 'Another.Path.To.Node', 1);

      expect(base.isChildOf(postfixed), 'to be false');
      expect(postfixed.isChildOf(base), 'to be false');

      expect(base.isChildOf(prefixed), 'to be false');
      expect(prefixed.isChildOf(base), 'to be false');
    });

    it('should return true for real parents', function() {
      const first = new NodeId(NodeId.NodeIdType.STRING, 'Path.To.Node', 1);
      const second = new NodeId(NodeId.NodeIdType.STRING, 'Path.To', 1);

      expect(first.isChildOf(second), 'to be true');
    });

    it('should return true for parent resource nodes', function() {
      const first = new NodeId(NodeId.NodeIdType.STRING, 'Path/to/Node', 1);
      const second = new NodeId(NodeId.NodeIdType.STRING, 'Path/to', 1);

      expect(first.isChildOf(second), 'to be true');
    });
  });

  /** @test {NodeId#inspect} */
  describe('#inspect', function() {
    const opts = {
      stylize: spy(t => t),
    };

    beforeEach(() => opts.stylize.resetHistory());

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
