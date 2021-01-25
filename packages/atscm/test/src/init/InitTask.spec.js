import { readdirSync } from 'fs';
import { join, isAbsolute, basename } from 'path';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { obj as createStream } from 'through2';
import { src } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import { ConfigLangs } from '../../../src/init/Options';

const destSpy = spy((c, e, cb) => cb(null));
const srcSpy = spy((c, e, cb) => cb(null, c));

const gulpStub = {
  src: (...args) => src(...args).pipe(createStream(srcSpy)),
  dest: () => createStream(destSpy),
};

const handlebarsSpy = spy(handlebars);

const InitTask = proxyquire('../../../src/init/InitTask', {
  gulp: gulpStub,
  handlebars: {
    default: handlebarsSpy,
  },
}).default;

/** @test {InitTask} */
describe('InitTask', function () {
  beforeEach(() => {
    srcSpy.resetHistory();
    destSpy.resetHistory();
    handlebarsSpy.resetHistory();
  });

  /** @test {InitTask.filesToHandle} */
  describe('.filesToHandle', function () {
    it('should return array of absolute paths', function () {
      expect(InitTask.filesToHandle('es2015'), 'to have items satisfying', 'to be a', 'string');
      expect(
        InitTask.filesToHandle('es2015'),
        'to have items satisfying',
        expect.it('when passed as parameter to', isAbsolute, 'to equal', true)
      );
    });
  });

  /** @test {InitTask.run} */
  describe('.run', function () {
    it('should handle all general files', function () {
      const files = readdirSync(join(__dirname, '../../../res/init/templates/general'));
      const renamedFiles = files.map((f) => (f === 'gitignore' ? '.gitignore' : f));

      return InitTask.run({ configLang: 'es2015' }).then(() => {
        expect(srcSpy.callCount, 'to be greater than', 0);

        const handled = srcSpy.args.map((args) => args[0]);
        const resulting = destSpy.args.map((args) => args[0]);
        expect(handled, 'to have values satisfying', 'to have properties', { _isVinyl: true });

        expect(
          resulting.map((f) => basename(f.history[0])),
          'to contain',
          ...files
        );
        expect(
          resulting.map((f) => f.relative),
          'to contain',
          ...renamedFiles
        );
      });
    });

    it('should not escape author field in package.json (#52)', function () {
      const author = 'Sample name <mail@example.com>';

      return InitTask.run({ configLang: 'es2015', author }).then(() => {
        expect(srcSpy.callCount, 'to be greater than', 0);

        const pkgOut = destSpy.args
          .map((args) => args[0])
          .filter((f) => f.relative === 'package.json')[0]
          .contents.toString();

        expect(JSON.parse(pkgOut).author, 'to equal', author);
      });
    });

    function expectHandlingLangFiles(configLang) {
      const files = readdirSync(join(__dirname, '../../../res/init/templates/lang', configLang));

      it(`should handle ${configLang} files`, function () {
        return InitTask.run({ configLang }).then(() => {
          const handled = srcSpy.args.map((args) => args[0].relative);
          const resulting = destSpy.args.map((args) => args[0].relative);

          expect(handled, 'to contain', ...files);
          expect(resulting, 'to contain', ...files);
        });
      });
    }

    // Check if all lang files are handled for all config langs
    Object.keys(ConfigLangs).forEach((l) => expectHandlingLangFiles(ConfigLangs[l]));
  });
});
