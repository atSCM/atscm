import { Buffer } from 'buffer';
import { EOL } from 'os';
import File from 'vinyl';
import { stub } from 'sinon';
import proxyquire from 'proxyquire';
import expect from '../../expect';

import AtviseFile from '../../../src/lib/server/AtviseFile';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import DisplayTransformer, { DisplayCache } from '../../../src/transform/DisplayTransformer';

const StubDisplayCache = proxyquire('../../../src/transform/DisplayTransformer', {
  fs: {
    readdir: (dir, cb) => cb(null, ['file.ext1', 'file.ext2']),
  },
}).DisplayCache;

/** @test {DisplayCache} */
describe('DisplayCache', function() {
  /** @test {DisplayCache#gotAllFiles} */
  describe('#gotAllFiles', function() {
    it('should forward readdir errors', function() {
      const cache = new DisplayCache();

      return expect(cb => cache.gotAllFiles(new File({ path: 'that/does/not.exist' }), cb),
        'to call the callback with error', /ENOENT/);
    });

    it('should store required files if missing', function() {
      const cache = new StubDisplayCache();

      return expect(cb => cache.gotAllFiles({ dirname: 'dirname' }, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be undefined');
          expect(cache._required.dirname, 'to equal', ['.ext1', '.ext2']);
        });
    });

    const fillCache = new StubDisplayCache();
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

/** @test {DisplayTransformer} */
describe('DisplayTransformer', function() {
  const nonDisplayFile = { isDisplay: false };

  /** @test {DisplayTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    it('should pass non-display files', function() {
      return expect(cb => DisplayTransformer.prototype.transformFromDB(nonDisplayFile, 'utf8', cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', nonDisplayFile);
        });
    });

    function writeXMLToDisplayTransformer(xmlString) {
      const transformer = new DisplayTransformer({ direction: TransformDirection.FromDB });
      const file = new AtviseFile({
        path: 'AGENT/DISPLAYS/Main.display.xml',
        contents: Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${xmlString}`),
      });

      const data = [];
      transformer.on('data', d => data.push(d));

      const promise = new Promise((resolve, reject) => {
        transformer.once('error', err => reject(err));
        transformer.once('end', () => resolve(data));
      });

      transformer.write(file);
      transformer.end();

      return promise;
    }

    it('should forward parse errors', function() {
      return expect(writeXMLToDisplayTransformer('invalid xml'),
        'to be rejected with', /Text data outside of root node/);
    });

    it('should error with invalid xml', function() {
      return expect(writeXMLToDisplayTransformer(''),
        'to be rejected with', /No `svg` tag/);
    });

    function expectFileContents(xmlString, filter) {
      return expect(writeXMLToDisplayTransformer(xmlString), 'to be fulfilled')
        .then(resultingFiles => {
          const _files = resultingFiles.filter(filter);
          try {
            expect(_files, 'to have length', 1);
          } catch (e) {
            throw new Error('Error in expectFileContents: filter returned multiple files');
          }

          const file = _files[0];

          return expect(file.contents, 'when decoded as', 'utf-8');
        });
    }

    function expectConfig(xmlString) {
      return expectFileContents(xmlString, file => file.extname === '.json')
        .then(string => {
          let obj;
          expect(() => (obj = JSON.parse(string)), 'not to throw');
          return obj;
        });
    }

    it('should store empty config for empty display', function() {
      return expectConfig('<svg></svg>')
        .then(config => {
          expect(config, 'to equal', {});
        });
    });

    it('should store dependencies in config when referenced as "src"', function() {
      return expectConfig(`<svg>
  <script src="path/to/dependency.js"></script>
</svg>`)
        .then(config => {
          expect(config.dependencies, 'to be defined');
          expect(config.dependencies, 'to have length', 1);
          expect(config.dependencies[0], 'to equal', 'path/to/dependency.js');
        });
    });

    it('should store dependencies in config when referenced as "xlink:href"', function() {
      return expectConfig(`<svg>
  <script xlink:href="path/to/dependency.js"></script>
</svg>`)
        .then(config => {
          expect(config.dependencies, 'to be defined');
          expect(config.dependencies, 'to have length', 1);
          expect(config.dependencies[0], 'to equal', 'path/to/dependency.js');
        });
    });

    it('should store multiple dependencies in config', function() {
      return expectConfig(`<svg>
  <script src="path/to/dependency1.js"></script>
  <script src="path/to/dependency2.js"></script>
</svg>`)
        .then(config => {
          expect(config.dependencies, 'to be defined');
          expect(config.dependencies, 'to have length', 2);
          expect(config.dependencies[0], 'to equal', 'path/to/dependency1.js');
          expect(config.dependencies[1], 'to equal', 'path/to/dependency2.js');
        });
    });

    context('when display contains inline script', function() {
      const script = 'console.log("called");';

      it('should be stored when given with attributes', function() {
        return expectFileContents(`<svg>
  <script type="text/javascript">${script}</script>
</svg>`, file => file.extname === '.js')
          .then(string => {
            expect(string, 'to equal', script);
          });
      });

      it('should be stored when given without attributes', function() {
        return expectFileContents(`<svg>
  <script>${script}</script>
</svg>`, file => file.extname === '.js')
          .then(string => {
            expect(string, 'to equal', script);
          });
      });

      it('should store empty inline scripts in separate file', function() {
        return expectFileContents(`<svg>
  <script type="text/javascript"></script>
</svg>`, file => file.extname === '.js')
          .then(string => {
            expect(string, 'to equal', '');
          });
      });
    });

    context('when display contains metadata', function() {
      it('should work without parameters', function() {
        return expectConfig(`<svg>
  <metadata></metadata>
</svg>`)
          .then(config => {
            expect(config, 'to be defined');
          });
      });

      it('should store parameters', function() {
        return expectConfig(`<svg>
  <metadata>
    <atv:parameter behavior="mandatory" desc="base" valuetype="address" name="base"/>
    <atv:parameter behavior="optional" desc="state label" substitute="$LABEL$" valuetype="trstring"
      defaultvalue="T{Switched on}" name="labelOn"/>
  </metadata>
</svg>`)
          .then(config => {
            expect(config.parameters, 'to be defined');
            expect(config.parameters, 'to be a', Array);
            expect(config.parameters, 'to have length', 2);
            expect(config.parameters[0], 'to equal', {
              name: 'base',
              behavior: 'mandatory',
              desc: 'base',
              valuetype: 'address',
            });
            expect(config.parameters[1], 'to equal', {
              name: 'labelOn',
              behavior: 'optional',
              desc: 'state label',
              valuetype: 'trstring',
              defaultvalue: 'T{Switched on}',
              substitute: '$LABEL$',
            });
          });
      });
    });

    context('when encoding fails', function() {
      beforeEach(() => stub(DisplayTransformer.prototype, 'encodeContents',
        (obj, cb) => cb(new Error('Encode error'))));
      afterEach(() => DisplayTransformer.prototype.encodeContents.restore());

      it('should forward encode error', function() {
        return expect(writeXMLToDisplayTransformer('<svg></svg>'),
          'to be rejected with', 'Encode error');
      });
    });
  });

  /** @test {DisplayTransformer#createDisplay} */
  describe('#createDisplay', function() {
    function createDisplayWithFileContents(contents) {
      let lastKey;
      const files = Object.keys(contents).reduce((prev, ext) => {
        const result = prev;

        result[ext] = new File({
          path: `path/to/test.display/test${ext}`,
          contents: Buffer.from(contents[ext]),
        });

        lastKey = ext;
        return result;
      }, {});

      const transformer = new DisplayTransformer({ direction: TransformDirection.FromFilesystem });

      return cb => transformer.createDisplay(files, files[lastKey], cb);
    }

    it('should fail with invalid config file', function() {
      return expect(createDisplayWithFileContents({
        '.json': '',
      }), 'to call the callback with error', /Error parsing JSON/);
    });

    it('should fail without SVG file', function() {
      return expect(createDisplayWithFileContents({
        '.json': '{}',
      }), 'to call the callback with error', /No display SVG in/);
    });

    it('should fail with invalid SVG', function() {
      return expect(createDisplayWithFileContents({
        '.svg': 'invalid XML',
      }), 'to call the callback with error', /Non-whitespace before first tag/);
    });

    it('should fail without `svg` tag', function() {
      return expect(createDisplayWithFileContents({
        '.svg': '<root></root>',
      }), 'to call the callback with error', /Error parsing display SVG: No `svg` tag/);
    });

    function expectDisplayWithFileContentToHaveXML(contents, xmlString) {
      return expect(createDisplayWithFileContents(contents), 'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be a', File);
          expect(args[1].contents, 'to be a', Buffer);

          return expect(args[1].contents.toString(),
            'to equal', `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
${xmlString}`.replace(new RegExp(EOL, 'g'), '\r\n'));
        });
    }

    it('should work with empty svg tag', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg></svg>',
      }, '<svg/>');
    });

    it('should inline script', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg><rect></rect></svg>',
        '.js': 'code()',
      }, `<svg>
 <rect/>
 <script type="text/ecmascript"><![CDATA[code()]]></script>
</svg>`);
    });

    it('should link dependencies', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg><rect></rect></svg>',
        '.json': '{ "dependencies": ["path/to/dep.js"] }',
      }, `<svg>
 <rect/>
 <script src="path/to/dep.js"/>
</svg>`);
    });

    it('should work without empty parameters config', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg><rect></rect></svg>',
        '.json': '{ "parameters": [] }',
      }, `<svg>
 <rect/>
</svg>`);
    });

    it('should reuse existant metadata section', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': `<svg>
  <metadata>
    <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
  </metadata>
</svg>`,
        '.json': '{ "parameters": [{ "name": "test" }] }',
      }, `<svg>
 <metadata>
  <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
  <atv:parameter name="test"/>
 </metadata>
</svg>`);
    });

    it('should create metadata section if omitted', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg></svg>',
        '.json': '{ "parameters": [{ "name": "test" }] }',
      }, `<svg>
 <metadata>
  <atv:parameter name="test"/>
 </metadata>
</svg>`);
    });

    it('should keep parameters specified in SVG', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': `<svg>
  <metadata>
    <atv:parameter name="existant"/>
  </metadata>
</svg>`,
        '.json': '{ "parameters": [{ "name": "test" }] }',
      }, `<svg>
 <metadata>
  <atv:parameter name="existant"/>
  <atv:parameter name="test"/>
 </metadata>
</svg>`);
    });

    context('when encoding fails', function() {
      beforeEach(() => stub(DisplayTransformer.prototype, 'encodeContents',
        (obj, cb) => cb(new Error('Encode error'))));
      afterEach(() => DisplayTransformer.prototype.encodeContents.restore());

      it('should forward encode error', function() {
        return expect(createDisplayWithFileContents({
          '.svg': '<svg><rect></rect></svg>',
        }), 'to call the callback with error', 'Encode error');
      });
    });
  });

  /** @test {DisplayTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function() {
    it('should pass non-display files', function() {
      return expect(cb =>
        DisplayTransformer.prototype.transformFromFilesystem(nonDisplayFile, 'utf8', cb),
        'to call the callback'
      )
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', nonDisplayFile);
        });
    });

    it('should forward cache errors', function() {
      const transformer = new DisplayTransformer({ direction: TransformDirection.FromFilesystem });
      transformer._displayCache.gotAllFiles = (file, cb) => cb(new Error('Cache error'));

      expect(cb => transformer.transformFromFilesystem(
        new AtviseFile({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback with error', 'Cache error');
    });

    it('should cache display files', function() {
      const transformer = new DisplayTransformer({ direction: TransformDirection.FromFilesystem });
      transformer._displayCache.gotAllFiles = (files, cb) => cb(null, false);

      return expect(cb =>
          transformer.transformFromFilesystem(
            new AtviseFile({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback'
      )
        .then(args => {
          expect(args[0], 'to be falsy');
        });
    });

    it('should call #createDisplay if all required files are cached', function() {
      const transformer = new DisplayTransformer({ direction: TransformDirection.FromFilesystem });
      const stubDisplay = {};
      transformer._displayCache.gotAllFiles = (files, cb) => cb(null, [{}]);
      stub(transformer, 'createDisplay', (files, last, cb) => cb(null, stubDisplay));

      return expect(cb =>
          transformer.transformFromFilesystem(
            new AtviseFile({ path: 'path/name.display/name.js' }), 'utf8', cb),
        'to call the callback'
      )
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to be', stubDisplay);
        });
    });
  });
});
