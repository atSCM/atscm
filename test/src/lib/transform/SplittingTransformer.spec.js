import expect from 'unexpected';
import proxyquire from 'proxyquire';

import File from 'vinyl';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';
import SplittingTransformer, {
  CombineFilesCache,
} from '../../../../src/lib/transform/SplittingTransformer';

const StubCombineFilesCache = proxyquire('../../../../src/lib/transform/SplittingTransformer', {
  fs: {
    readdir: (dir, cb) => cb(null, ['file.ext1', 'file.ext2']),
  },
}).CombineFilesCache;

/** @test {CombineFilesCache} */
describe('CombineFilesCache', function() {
  /** @test {CombineFilesCache#gotAllFiles} */
  describe('#gotAllFiles', function() {
    it('should forward readdir errors', function() {
      const cache = new CombineFilesCache();

      return expect(cb => cache.gotAllFiles(new File({ path: 'that/does/not.exist' }), cb),
        'to call the callback with error', /ENOENT/);
    });

    it('should store required files if missing', function() {
      const cache = new StubCombineFilesCache();

      return expect(cb => cache.gotAllFiles({ dirname: 'dirname' }, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be undefined');
          expect(cache._required.dirname, 'to equal', ['.ext1', '.ext2']);
        });
    });

    const fillCache = new StubCombineFilesCache();
    const file1 = { dirname: 'dirname', extname: '.ext1' };
    const file2 = { dirname: 'dirname', extname: '.ext2' };

    it('should cache passed file', function() {
      return expect(cb => fillCache.gotAllFiles(file1, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be undefined');
          expect(fillCache._required.dirname, 'to equal', ['.ext1', '.ext2']);
          expect(fillCache._files.dirname['.ext1'], 'to equal', file1);
        });
    });

    it('should pass all cached files if all required are present', function() {
      return expect(cb => fillCache.gotAllFiles(file2, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to equal', {
            '.ext1': file1,
            '.ext2': file2,
          });

          // Expect cache is cleaned
          expect(fillCache._files.dirname, 'to be undefined');
        });
    });
  });
});

/** @test {SplittingTransformer} */
describe('SplittingTransformer', function() {
  /** @test {SplittingTransformer#createCombinedFile} */
  describe('#createCombinedFile', function() {
    it('should throw if not overridden', function() {
      expect(() => SplittingTransformer.prototype.createCombinedFile(),
        'to throw', /must be implemented/);
    });
  });

  /** @test {SplittingTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function() {
    it('should forward cache errors', function() {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      transformer._combineFilesCache.gotAllFiles = (file, cb) => cb(new Error('Cache error'));

      expect(cb => transformer.transformFromFilesystem(
        new File({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback with error', 'Cache error');
    });

    it('should cache display files', function() {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      transformer._combineFilesCache.gotAllFiles = (files, cb) => cb(null, false);

      return expect(cb =>
          transformer.transformFromFilesystem(
            new File({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback'
      )
        .then(args => {
          expect(args[0], 'to be falsy');
        });
    });

    it('should call #createCombinedFile if all required files are cached', function() {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      const stubDisplay = {};
      transformer._combineFilesCache.gotAllFiles = (files, cb) => cb(null, [{}]);
      transformer.createCombinedFile = (files, last, cb) => cb(null, stubDisplay);

      return expect(cb =>
          transformer.transformFromFilesystem(
            new File({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback'
      )
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', stubDisplay);
        });
    });
  });

  /** @test {SplittingTransformer.splitFile} */
  describe('.splitFile', function() {
    const original = new File({
      path: 'path/name.type.ext',
    });

    it('should return a file', function() {
      expect(SplittingTransformer.splitFile(original, '.another'), 'to be a', File);
    });

    it('should apply the new extension', function() {
      expect(SplittingTransformer.splitFile(original, '.another').extname, 'to equal', '.another');
    });
  });

  /** @test {SplittingTransformer.combineFiles} */
  describe('.combineFiles', function() {
    const originals = [
      new File({ path: 'path/name.type/name.ext1' }),
      new File({ path: 'path/name.type/name.ext2' }),
    ];

    it('should return a file', function() {
      expect(SplittingTransformer.combineFiles(originals, '.another'), 'to be a', File);
    });

    it('should apply the new extension', function() {
      expect(SplittingTransformer.combineFiles(originals, '.other').extname, 'to equal', '.other');
    });
  });
});
