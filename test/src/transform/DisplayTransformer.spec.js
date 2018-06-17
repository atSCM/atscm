import { Buffer } from 'buffer';
import File from 'vinyl';
import { stub } from 'sinon';
import expect from '../../expect';
import AtviseFile from '../../../src/lib/server/AtviseFile';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import DisplayTransformer from '../../../src/transform/DisplayTransformer';

/** @test {DisplayTransformer} */
describe('DisplayTransformer', function() {
  const nonDisplayFile = { isDisplay: false };

  /** @test {DisplayTransformer#shouldBeTransformed} */
  describe('#shouldBeTransformed', function() {
    it('should return false for non-display files', function() {
      expect(DisplayTransformer.prototype.shouldBeTransformed(nonDisplayFile), 'to equal', false);
    });
  });

  /** @test {DisplayTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
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

    context('when display contains metadata tag', function() {
      it('should work without actual metadata', function() {
        return expectConfig(`<svg>
  <metadata></metadata>
</svg>`)
          .then(config => {
            expect(config, 'to be defined');
          });
      });

      it('should work without parameters', function() {
        return expectConfig(`<svg>
  <metadata>
    <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
  </metadata>
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
      beforeEach(() => stub(DisplayTransformer.prototype, 'encodeContents')
        .callsFake((obj, cb) => cb(new Error('Encode error'))));
      afterEach(() => DisplayTransformer.prototype.encodeContents.restore());

      it('should forward encode error', function() {
        return expect(writeXMLToDisplayTransformer('<svg></svg>'),
          'to be rejected with', /Encode error/);
      });
    });
  });

  /** @test {DisplayTransformer#createCombinedFile} */
  describe('#createCombinedFile', function() {
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

      return cb => transformer.createCombinedFile(files, files[lastKey], cb);
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
      }), 'to call the callback with error', /Text data outside of root node/);
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
${xmlString}`.replace(/\r?\n|\r/g, '\r\n'));
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
 <script xlink:href="path/to/dep.js"/>
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
  <atv:parameter name="test"/>
  <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
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
  <atv:parameter name="test"/>
  <atv:parameter name="existant"/>
 </metadata>
</svg>`);
    });

    it('should insert parameters before other atv tags', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': `<svg>
  <metadata>
    <atv:parameter name="existant"/>
    <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
  </metadata>
</svg>`,
        '.json': '{ "parameters": [{ "name": "test" }] }',
      }, `<svg>
 <metadata>
  <atv:parameter name="test"/>
  <atv:parameter name="existant"/>
  <atv:gridconfig height="20" width="20" enabled="false" gridstyle="lines"/>
 </metadata>
</svg>`);
    });

    it('should insert parameters in the correct order', function() {
      return expectDisplayWithFileContentToHaveXML({
        '.svg': '<svg></svg>',
        '.json': '{ "parameters": [{ "name": "test" }, { "name": "another" }] }',
      }, `<svg>
 <metadata>
  <atv:parameter name="test"/>
  <atv:parameter name="another"/>
 </metadata>
</svg>`);
    });

    context('when encoding fails', function() {
      beforeEach(() => stub(DisplayTransformer.prototype, 'encodeContents')
        .callsFake((obj, cb) => cb(new Error('Encode error'))));
      afterEach(() => DisplayTransformer.prototype.encodeContents.restore());

      it('should forward encode error', function() {
        return expect(createDisplayWithFileContents({
          '.svg': '<svg><rect></rect></svg>',
        }), 'to call the callback with error', 'Encode error');
      });
    });
  });
});
