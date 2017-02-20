import expect from 'unexpected';

import { EOL } from 'os';
import { Builder } from 'xml2js';
import Transformer, { TransformDirection } from '../../../../src/lib/transform/Transformer';
import XMLTransformer from '../../../../src/lib/transform/XMLTransformer';

/** @test {XMLTransformer} */
describe('XMLTransformer', function() {
  /** @test {XMLTransformer#constructor} */
  describe('#constructor', function() {
    it('should return a Transformer', function() {
      expect(new XMLTransformer(), 'to be a', Transformer);
    });

    it('should create a _fromDBBuilder', function() {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', Builder);
    });

    it('should create a _fromFilesystemBuilder', function() {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', Builder);
    });
  });

  /** @test {XMLTransformer#builder} */
  describe('#builder', function() {
    it('should return the #_fromDBBuilder if direction is FromDB', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromDB });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromDBBuilder);
    });

    it('should return the #_fromDBBuilder if direction is FromFilesystem', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromFilesystem });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromFilesystemBuilder);
    });
  });

  /** @test {XMLTransformer#decodeContents} */
  describe('#decodeContents', function() {
    it('should forward errors', function(done) {
      expect(cb => (new XMLTransformer()).decodeContents({ contents: 'no valid xml' }, cb),
        'to call the callback with error', /Non-whitespace before first tag./)
        .then(() => done());
    });

    it('should return object for valid xml', function(done) {
      expect(cb => (new XMLTransformer()).decodeContents({ contents: '<tag>value</tag>' }, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to equal', { tag: 'value' });
          done();
        });
    });
  });

  function testBuilder(direction, object, expectedResult, callback) {
    const transformer = new XMLTransformer({ direction });

    expect(cb => transformer.encodeContents(object, cb), 'to call the callback')
      .then(args => {
        expect(args[0], 'to be falsy');
        expect(args[1], 'to contain', expectedResult);
        callback();
      });
  }

  /** @test {XMLTransformer#encodeContents} */
  describe('#encodeContents', function() {
    it('should forward errors', function() {
      expect(cb => (new XMLTransformer()).encodeContents(null, cb),
        'to call the callback with error', 'Cannot convert undefined or null to object');
    });

    context('when direction is FromDB', function() {
      it('should indent with double space', function(done) {
        testBuilder(TransformDirection.FromDB, { root: { sub: 'test' } },
          `<root>${EOL}  <sub>test</sub>${EOL}</root>`, done);
      });
    });

    context('when direction is FromFilesytem', function() {
      it('should indent with single space', function(done) {
        testBuilder(TransformDirection.FromFilesystem, { root: { sub: 'test' } },
          '<root>\r\n <sub>test</sub>\r\n</root>', done);
      });
    });
  });
});
