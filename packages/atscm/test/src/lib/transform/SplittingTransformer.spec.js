import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import File from 'vinyl';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';
import AtviseFile from '../../../../src/lib/server/AtviseFile';
import SplittingTransformer, {
  CombineFilesCache,
} from '../../../../src/lib/transform/SplittingTransformer';

class StubSplittingTransformer extends proxyquire(
  '../../../../src/lib/transform/SplittingTransformer',
  {
    '../server/AtviseFile': {
      _esModule: true,
      default: class StubAtviseFile extends AtviseFile {
        static read(options) {
          return Promise.resolve(options);
        }
      },
    },
  }
).default {
  constructor(combineError) {
    super();

    this.combineError = combineError;
  }

  createCombinedFile(files, last, callback) {
    if (this.combineError) {
      callback(this.combineError);
    } else {
      callback(null, last);
    }
  }
}

/** @test {CombineFilesCache} */
describe.skip('CombineFilesCache', function () {
  /** @test {CombineFilesCache#missingExtensions} */
  describe('#missingExtensions', function () {
    it('should return extensions if required files are missing', function () {
      const cache = new CombineFilesCache();
      cache._files.fakeDir = { '.ext': {} };
      cache._required.fakeDir = ['.ext', '.ext2'];

      expect(cache.missingExtensions('fakeDir'), 'to equal', ['.ext2']);
    });

    it('should return empty array if all required files are cached', function () {
      const cache = new CombineFilesCache();
      cache._files.fakeDir = { '.ext': {} };
      cache._required.fakeDir = ['.ext'];

      expect(cache.missingExtensions('fakeDir'), 'to equal', []);
    });
  });

  /** @test {CombineFilesCache#gotAllFiles}
  describe('#gotAllFiles', function() {
    it('should forward readdir errors', function() {
      const cache = new CombineFilesCache();

      return expect(cb => cache.gotAllFiles(new File({ path: 'that/does/not.exist' }), cb),
        'to call the callback with error', /ENOENT/);
    });

    it.skip('should store required files if missing', function() {
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

    it.skip('should cache passed file', function() {
      return expect(cb => fillCache.gotAllFiles(file1, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be undefined');
          expect(fillCache._required.dirname, 'to equal', ['.ext1', '.ext2']);
          expect(fillCache._files.dirname['.ext1'], 'to equal', file1);
        });
    });

    it.skip('should pass all cached files if all required are present', function() {
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
  }); */
});

/** @test {SplittingTransformer} */
describe('SplittingTransformer', function () {
  /** @test {SplittingTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function () {
    it.skip('should forward cache errors', function () {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      transformer._combineFilesCache.gotAllFiles = (file, cb) => cb(new Error('Cache error'));

      expect(
        (cb) =>
          transformer.transformFromFilesystem(
            new File({ path: 'path/name.display/name.js' }),
            'utf8',
            cb
          ),
        'to call the callback with error',
        'Cache error'
      );
    });

    it.skip('should cache display files', function () {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      transformer._combineFilesCache.gotAllFiles = (files, cb) => cb(null, false);

      return expect(
        (cb) =>
          transformer.transformFromFilesystem(
            new File({ path: 'path/name.display/name.js' }),
            'utf8',
            cb
          ),
        'to call the callback'
      ).then((args) => {
        expect(args[0], 'to be falsy');
      });
    });

    it.skip('should call #createCombinedFile if all required files are cached', function () {
      const transformer = new SplittingTransformer({
        direction: TransformDirection.FromFilesystem,
      });
      const stubDisplay = {};
      transformer._combineFilesCache.gotAllFiles = (files, cb) => cb(null, [{}]);
      transformer.createCombinedFile = (files, last, cb) => cb(null, stubDisplay);

      return expect(
        (cb) =>
          transformer.transformFromFilesystem(
            new File({ path: 'path/name.display/name.js' }),
            'utf8',
            cb
          ),
        'to call the callback'
      ).then((args) => {
        expect(args[0], 'to be falsy');
        expect(args[1], 'to be', stubDisplay);
      });
    });
  });

  /** @test {SplittingTransformer.splitFile} */
  describe.skip('.splitFile', function () {
    const original = new File({
      path: 'path/name.type.ext',
    });

    it('should return a file', function () {
      expect(SplittingTransformer.splitFile(original, '.another'), 'to be a', File);
    });

    it('should apply the new extension', function () {
      expect(SplittingTransformer.splitFile(original, '.another').extname, 'to equal', '.another');
    });
  });

  /** @test {SplittingTransformer.combineFiles} */
  describe.skip('.combineFiles', function () {
    const originals = [
      new File({ path: 'path/name.type/name.ext1' }),
      new File({ path: 'path/name.type/name.ext2' }),
    ];

    it('should return a file', function () {
      expect(SplittingTransformer.combineFiles(originals, '.another'), 'to be a', File);
    });

    it('should apply the new extension', function () {
      expect(SplittingTransformer.combineFiles(originals, '.other').extname, 'to equal', '.other');
    });
  });

  /** @test {SplittingTransformer#_flush} */
  describe.skip('#_flush', function () {
    it('should just callback if no files are missing', function () {
      const transformer = new SplittingTransformer();
      const callback = spy();

      transformer._flush(callback);

      expect(callback.calledOnce, 'to be', true);
    });

    it('should push additional files if some are missing', function (done) {
      const transformer = new StubSplittingTransformer();
      const file = {
        cwd: '/fake/cwd',
        base: '/base',
      };

      transformer._combineFilesCache._files['base/not/existent/dir'] = {
        '.ext': file,
      };
      transformer._combineFilesCache._required['base/not/existent/dir'] = ['.ext', '.ext1'];
      spy(transformer, 'push');

      transformer._flush((err) => {
        expect(err, 'to be falsy');
        expect(transformer.push.calledOnce, 'to be true');
        expect(transformer.push.lastCall.args[0], 'to be', file);

        done();
      });
    });

    it('should forward read errors', function (done) {
      const transformer = new StubSplittingTransformer(new Error('Test error'));
      const file = {
        cwd: '/fake/cwd',
        base: '/base',
      };

      transformer._combineFilesCache._files['base/not/existent/dir'] = {
        '.ext': file,
      };
      transformer._combineFilesCache._required['base/not/existent/dir'] = ['.ext', '.ext1'];
      spy(transformer, 'push');

      transformer._flush((err) => {
        expect(err, 'to have message', 'Test error');

        done();
      });
    });
  });
});
