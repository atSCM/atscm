import { obj as createStream } from 'through2';
import { spy } from 'sinon';
import expect from '../../../expect';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';
import PartialTransformer from '../../../../src/lib/transform/PartialTransformer';

/** @test {PartialTransformer} */
describe('PartialTransformer', function() {
  /** @test {PartialTransformer#shouldBeTransformed} */
  describe('#shouldBeTransformed', function() {
    it('should throw if not overridden', function() {
      expect(() => PartialTransformer.prototype.shouldBeTransformed({}),
        'to throw', /must be implemented/);
    });
  });

  /** @test {PartialTransformer#_transform} */
  describe.skip('#_transform', function() {
    it('should pass original file if shouldBeTransformed returns false', function() {
      const transformer = new PartialTransformer();
      transformer.shouldBeTransformed = () => false;
      const file = {};

      expect(cb => transformer._transform(file, 'utf8', cb), 'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', file);
        });
    });

    it('should call super if shouldBeTransformed returns true', function() {
      const transformer = new PartialTransformer({ direction: TransformDirection.FromDB });
      const original = {};
      const result = {};

      transformer.shouldBeTransformed = () => true;
      transformer.transformFromDB = (file, enc, cb) => cb(null, result);

      expect(cb => transformer._transform(original, 'utf8', cb), 'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', result);
        });
    });
  });

  /** @test {PartialTransformer#applyToStream} */
  describe.skip('#applyToStream', function() {
    context('when #applyToFilteredStream is not overridden', function() {
      it('should invoke #transformFromDB / #transformFromFilesystem', function() {
        const transformer = new PartialTransformer();
        transformer.shouldBeTransformed = () => true;
        spy(transformer, 'withDirection');

        transformer.applyToStream(createStream(), TransformDirection.FromDB);

        expect(transformer.withDirection, 'was called once');
      });
    });

    context('when #applyToFilteredStream is overridden', function() {
      it('should invoke #applyToFilteredStream', function() {
        const transformer = new PartialTransformer();
        transformer.shouldBeTransformed = () => true;
        transformer.applyToStream = () => true;

        spy(transformer, 'withDirection');
        spy(transformer, 'applyToFilteredStream');

        expect(transformer.applyToStream(createStream(), TransformDirection.FromDB), 'to be true');
        expect(transformer.withDirection, 'was not called');
      });
    });
  });

  /** @test {PartialTransformer#applyToFilteredStream} */
  describe.skip('#applyToFilteredStream', function() {
    it('should return false by default', function() {
      expect(PartialTransformer.prototype.applyToFilteredStream(), 'to be false');
    });
  });
});
