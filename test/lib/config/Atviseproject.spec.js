import expect from 'unexpected';

import Atviseproject from '../../../src/lib/config/Atviseproject';
import NodeId from '../../../src/lib/db/NodeId';

/** @test {Atviseproject} */
describe('Atviseproject', function() {
  function expectNodeIds(arr) {
    it('should contain NodeIds', function() {
      arr.forEach(id => expect(id, 'to be a', NodeId));
    });
  }

  /** @test {Atviseproject.nodes} */
  describe('.nodes', function() {
    expectNodeIds(Atviseproject.nodes);
  });

  /** @test {Atviseproject.nodesToWatch} */
  describe('.nodesToWatch', function() {
    expectNodeIds(Atviseproject.nodesToWatch);
  });

  /** @test {Atviseproject.EditorRelatedNodes} */
  describe('.EditorRelatedNodes', function() {
    expectNodeIds(Atviseproject.EditorRelatedNodes);
  });

  /** @test {Atviseproject.ServerRelatedNodes} */
  describe('.ServerRelatedNodes', function() {
    expectNodeIds(Atviseproject.ServerRelatedNodes);
  });

  /** @test {Atviseproject.EditorRelatedNodes} */
  describe('.ignoreNodes', function() {
    expectNodeIds(Atviseproject.ignoreNodes);

    it('should contain Atviseproject.EditorRelatedNodes', function() {
      expect(Atviseproject.ignoreNodes, 'to contain', ...Atviseproject.EditorRelatedNodes);
    });

    it('should contain Atviseproject.ServerRelatedNodes', function() {
      expect(Atviseproject.ignoreNodes, 'to contain', ...Atviseproject.ServerRelatedNodes);
    });
  });

  /** @test {Atviseproject.inspect} */
  describe('.inspect', function() {
    it('should return the properties to print', function() {
      expect(Atviseproject.inspect(), 'to have properties', [
        'host',
        'port',
        'useTransformers',
        'nodes',
        'nodesToWatch',
        'ignoreNodes'
      ]);
    });
  });
});
