import expect from 'unexpected';
import { spy } from 'sinon';
import proxyquire from 'proxyquire';
import { obj as createStream } from 'through2';
import { src } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import { transform as babelTransform } from '@babel/core';
import { transpileModule as tsTransform } from 'typescript';
import evaluate from 'eval';
import pkg from '../../../package.json';
import Atviseproject from '../../../src/lib/config/Atviseproject';

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
    srcSpy.resetHistory();
    destSpy.resetHistory();
    handlebarsSpy.resetHistory();
  });

  function expectValidConfig(lang, transform) {
    it(`should create valid ${lang} config`, function () {
      return InitTask.run(optionsForLang(lang)).then(() => {
        const createdFiles = destSpy.args.map((args) => args[0]);

        // Expect config file is created
        const configs = createdFiles.filter((file) => file.relative.match(/Atviseproject/));
        expect(configs, 'to have length', 1);

        // Expect code can be transpiled
        const configCode = configs[0].contents.toString();
        let resultingCode;
        expect(
          () =>
            (resultingCode = transform(configCode, createdFiles).replace(
              /require\(['|"]atscm['|"]\)/,
              "require('../../../')"
            )),
          'not to throw'
        );

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
    const rcs = createdFiles.filter((file) => file.relative.match(/.babelrc/));

    expect(rcs, 'to have length', 1);

    const rc = JSON.parse(rcs[0].contents.toString());

    return babelTransform(code, rc).code;
  });

  expectValidConfig('es5', (code) => code);

  expectValidConfig('ts', (code, createdFiles) => {
    const rcs = createdFiles.filter((file) => file.relative.match(/tsconfig.json/));

    expect(rcs, 'to have length', 1);

    const rc = JSON.parse(rcs[0].contents.toString());

    return tsTransform(code, rc).outputText;
  });
});
