import expect from 'unexpected';

import * as globalExports from '../../src/index';
import Atviseproject from '../../src/lib/config/Atviseproject';
import NodeId from '../../src/lib/server/NodeId';
import Transformer, { TransformDirection } from '../../src/lib/transform/Transformer';

describe('atscm module', function() {
  /** @test {Atviseproject} */
  it('should export Atviseproject class', function() {
    expect(globalExports.Atviseproject, 'to be', Atviseproject);
  });

  /** @test {NodeId} */
  it('should export NodeId class', function() {
    expect(globalExports.NodeId, 'to be', NodeId);
  });

  /** @test {Transformer} */
  it('should export Transformer class', function() {
    expect(globalExports.Transformer, 'to be', Transformer);
  });

  /** @test {TransformDirection} */
  it('should export TransformDirection enum', function() {
    expect(globalExports.TransformDirection, 'to be', TransformDirection);
  });
});
