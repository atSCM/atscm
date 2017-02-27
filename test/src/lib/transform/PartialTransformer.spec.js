import expect from 'unexpected';

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
  describe('#_transform', function() {
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

    it('should call super if shouldbeTransformed returns true', function() {
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
});
