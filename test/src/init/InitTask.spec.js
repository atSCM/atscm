import { readdirSync } from 'fs';
import { join, isAbsolute } from 'path';
import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';

import { obj as createStream } from 'through2';
import { src } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import { transform as babelTransform } from 'babel-core';
import { transpileModule as tsTransform } from 'typescript';
// import { compile as coffeeTransform } from 'coffee-script';
import evaluate from 'eval';

import pkg from '../../../package.json';
import { ConfigLangs } from '../../../src/init/Options';
import Atviseproject from '../../../src/lib/config/Atviseproject';

// const srcSpy = spy(() => ({ pipe: () => {} }));
// const handlebarsSpy = spy(() => ({ pipe: () => {} }));
const destSpy = spy((c, e, cb) => cb(null));
const srcSpy = spy((c, e, cb) => cb(null, c));

const gulpStub = {
  src: (...args) => src(...args)
    .pipe(createStream(srcSpy)),
  dest: () => createStream(destSpy),
};

const handlebarsSpy = spy(handlebars);

const InitTask = proxyquire('../../../src/init/init', {
  gulp: gulpStub,
  handlebars: {
    default: handlebarsSpy,
  },
}).InitTask;

/** @test {InitTask} */
describe('InitTask', function() {
  const baseConfig = {
    name: 'unit-testing',
    atviseHost: 'localhost',
    atvisePortOpc: 4840,
    atvisePortHttp: 80,
    modulePackage: pkg,
  };

  function optionsForLang(lang) {
    return Object.assign({ configLang: lang }, baseConfig);
  }

  beforeEach(() => {
    srcSpy.reset();
    destSpy.reset();
    handlebarsSpy.reset();
  });

  /** @test {InitTask.filesToHandle} */
  describe('.filesToHandle', function() {
    it('should return array of absolute paths', function() {
      expect(InitTask.filesToHandle('es2015'), 'to have items satisfying', 'to be a', 'string');
      expect(InitTask.filesToHandle('es2015'), 'to have items satisfying', path => {
        expect(isAbsolute(path), 'to be', true);
      });
    });
  });

  /** @test {InitTask.run} */
  describe('.run', function() {
    it('should handle all general files', function() {
      const files = readdirSync(
        join(__dirname, '../../../res/init/templates/general')
      );

      return InitTask.run({ configLang: 'es2015' })
        .then(() => {
          expect(srcSpy.callCount, 'to be greater than', 0);

          const handled = srcSpy.args.map(args => args[0]);
          const resulting = destSpy.args.map(args => args[0]);
          expect(handled, 'to have values satisfying',
            'to have properties', { _isVinyl: true });

          expect(handled.map(f => f.relative), 'to contain', ...files);
          expect(resulting.map(f => f.relative), 'to contain', ...files);
        });
    });

    function expectHandlingLangFiles(configLang) {
      const files = readdirSync(
        join(__dirname, '../../../res/init/templates/lang', configLang)
      );

      it(`should handle ${configLang} files`, function() {
        return InitTask.run({ configLang })
          .then(() => {
            const handled = srcSpy.args.map(args => args[0].relative);
            const resulting = destSpy.args.map(args => args[0].relative);

            expect(handled, 'to contain', ...files);
            expect(resulting, 'to contain', ...files);
          });
      });
    }

    // Check if all lang files are handled for all config langs
    Object.keys(ConfigLangs).forEach(l => expectHandlingLangFiles(ConfigLangs[l]));

    function expectValidConfig(lang, transform) {
      it(`should create valid ${lang} config`, function() {
        return InitTask.run(optionsForLang(lang))
          .then(() => {
            const createdFiles = destSpy.args.map(args => args[0]);

            // Expect config file is created
            const configs = createdFiles.filter(file => file.relative.match(/Atviseproject/));
            expect(configs, 'to have length', 1);

            // Expect code can be transpiled
            const configCode = configs[0].contents.toString();
            let resultingCode;
            expect(() => (resultingCode = transform(configCode, createdFiles)), 'not to throw');

            // Expect transpiled code to be runnable
            let config;
            expect(() => (config = evaluate(resultingCode, true).default), 'not to throw');

            // Expect config to extend Atviseproject
            expect(config, 'to have properties', Object.getOwnPropertyNames(Atviseproject));
            expect(config.name, 'to equal', 'UnitTesting');
            expect(config.host, 'to equal', baseConfig.atviseHost);
            expect(config.port.opc, 'to equal', baseConfig.atvisePortOpc);
            expect(config.port.http, 'to equal', baseConfig.atvisePortHttp);
          });
      });
    }

    expectValidConfig('es2015', (code, createdFiles) => {
      const rcs = createdFiles.filter(file => file.relative.match(/.babelrc/));

      expect(rcs, 'to have length', 1);

      const rc = JSON.parse(rcs[0].contents.toString());

      return babelTransform(code, rc).code;
    });

    expectValidConfig('es5', code => code);

    expectValidConfig('ts', (code, createdFiles) => {
      const rcs = createdFiles.filter(file => file.relative.match(/tsconfig.json/));

      expect(rcs, 'to have length', 1);

      const rc = JSON.parse(rcs[0].contents.toString());

      return tsTransform(code, rc).outputText;
    });

    // FIXME: CoffeeScript does not yet work.
    /*
    expectValidConfig('coffee', (code, createdFiles) => {

      return coffeeTransform(code);
    });
    */
  });
});
