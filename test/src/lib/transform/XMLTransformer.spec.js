import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';
import { DOMParser } from 'xmldom';
import Logger from 'gulplog';
import { TransformDirection } from '../../../../src/lib/transform/Transformer';
import XMLTransformer from '../../../../src/lib/transform/XMLTransformer';

/** @test {XMLTransformer} */
describe('XMLTransformer', function() {
  /** @test {XMLTransformer#serializationOptions} */
  describe('#serializationOptions', function() {
    context('if running FromDB', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromDB });

      it('should use default indent', function() {
        expect(transformer.serializationOptions.indent, 'to be undefined');
      });

      it('should use default newline', function() {
        expect(transformer.serializationOptions.newline, 'to be undefined');
      });
    });

    context('if running FromFilesystem', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromFilesystem });

      it('should use indent of one space', function() {
        expect(transformer.serializationOptions.indent, 'to equal', 1);
      });

      it('should use windows newline', function() {
        expect(transformer.serializationOptions.newline, 'to equal', '\r\n');
      });
    });
  });

  /** @test {XMLTransformer#_getParserErrorMessage} */
  describe('#_getParserErrorMessage', function() {
    it('should parse regular xmldom error messages', function() {
      const msg = ['[xmldom error]\tinvalid document source', '\n@#[line:1,col:2]'];

      expect(XMLTransformer.prototype._getParserErrorMessage(msg),
        'to equal', 'invalid document source');
    });

    it('should not fail if xmldoc or sax changes error handling api', function() {
      expect(XMLTransformer.prototype._getParserErrorMessage(['single error arg']),
        'to equal', 'single error arg');
    });
  });

  /** @test {XMLTransformer#_getParserErrorInfo} */
  describe('#_getParserErrorInfo', function() {
    it('should return parser position', function() {
      const parser = { options: { locator: { lineNumber: 1, columnNumber: 2 } } };

      expect(XMLTransformer.prototype._getParserErrorInfo(parser, {}),
        'to satisfy', { line: 1, column: 2 });
    });

    it('should return file path', function() {
      const parser = { options: { locator: { lineNumber: 1, columnNumber: 2 } } };

      expect(XMLTransformer.prototype._getParserErrorInfo(parser, { relative: 'path/file.ext' }),
        'to satisfy', { path: 'path/file.ext' });
    });
  });

  /** @test {XMLTransformer#decodeContents} */
  describe('#decodeContents', function() {
    Logger.on('error', () => {}); // Prevent exit on Logger.error

    it('should forward errors', function() {
      return expect(cb => (new XMLTransformer())
          .decodeContents({
            contents: '>asdf<',
            relative: 'test',
          }, cb),
        'to call the callback with error', /Parse error/);
    });

    it('should return DOM document for valid xml', function() {
      return expect(cb => (new XMLTransformer()).decodeContents({
        contents: '<tag>value</tag>',
      }, cb), 'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1].constructor.name, 'to equal', 'Document');
        });
    });

    context('on parser error', function() {
      beforeEach(() => {
        stub(Logger, 'warn');
        stub(Logger, 'error');
      });

      afterEach(() => {
        Logger.warn.restore();
        Logger.error.restore();
      });

      it('should log warnings', function() {
        const StubTransformer = proxyquire('../../../../src/lib/transform/XMLTransformer', {
          xmldom: {
            DOMParser: class {
              constructor(options) { this.options = options; }
              parseFromString() {
                this.options.errorHandler.warning(['[xmldoc warning]\ttest warning']);
              }
            },
          },
        }).default;

        return expect(cb => (new StubTransformer())
            .decodeContents({ contents: '<root></root>' }, cb),
          'to call the callback without error')
          .then(() => expect(Logger.warn.calledOnce, 'to be true'));
      });

      it('should fail on error', function() {
        const StubTransformer = proxyquire('../../../../src/lib/transform/XMLTransformer', {
          xmldom: {
            DOMParser: class {
              constructor(options) { this.options = options; }
              parseFromString() {
                this.options.errorHandler.error(['[xmldoc error]\ttest error\n[line:1,col:3]']);
              }
            },
          },
        }).default;

        return expect(cb => (new StubTransformer())
            .decodeContents({ contents: '<root></root>' }, cb),
          'to call the callback with error', /test error/)
          .then(() => expect(Logger.error.calledOnce, 'to be true'));
      });

      it('should fail on fatal error', function() {
        const StubTransformer = proxyquire('../../../../src/lib/transform/XMLTransformer', {
          xmldom: {
            DOMParser: class {
              constructor(options) { this.options = options; }
              parseFromString() {
                this.options.errorHandler.fatalError(['[xmldoc error]\tfatal\n[line:1,col:3]']);
              }
            },
          },
        }).default;

        return expect(cb => (new StubTransformer())
            .decodeContents({ contents: '<root></root>' }, cb),
          'to call the callback with error', /fatal/)
          .then(() => expect(Logger.error.calledOnce, 'to be true'));
      });

      it('should handle sync errors', function() {
        const StubTransformer = proxyquire('../../../../src/lib/transform/XMLTransformer', {
          xmldom: {
            DOMParser: class {
              constructor(options) { this.options = options; }
              parseFromString() {
                throw new Error('Test');
              }
            },
          },
        }).default;

        return expect(cb => (new StubTransformer())
            .decodeContents({ contents: '<root></root>' }, cb),
          'to call the callback with error', 'Test');
      });
    });
  });

  /** @test {XMLTransformer#getElementAttributes} */
  describe('#getElementAttributes', function() {
    const elm = (new DOMParser())
      .parseFromString('<root attr1="one" attr2="two" />')
      .documentElement;

    expect(XMLTransformer.prototype.getElementAttributes(elm), 'to equal', {
      attr1: 'one',
      attr2: 'two',
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
      return expect(cb => (new XMLTransformer()).encodeContents(null, cb),
        'to call the callback with error', 'Cannot convert undefined or null to object');
    });

    it('should error without document element', function() {
      const doc = (new DOMParser()).parseFromString('<!-- test -->');

      return expect(cb => (new XMLTransformer()).encodeContents(doc, cb),
        'to call the callback with error', 'Missing document element');
    });

    it('should error with non-document input', function() {
      const elm = (new DOMParser()).parseFromString('<root />').createElement('asdf');

      return expect(cb => (new XMLTransformer()).encodeContents(elm, cb),
        'to call the callback with error', 'Not a DOMDocument instance');
    });

    const validDocument = (new DOMParser()).parseFromString('<root><sub>test</sub></root>');

    context('when direction is FromDB', function() {
      it('should indent with double space', function(done) {
        testBuilder(TransformDirection.FromDB, validDocument,
          `  <sub>test</sub>
</root>`, done);
      });
    });

    context('when direction is FromFilesytem', function() {
      it('should indent with single space', function(done) {
        testBuilder(TransformDirection.FromFilesystem, validDocument,
          '\r\n <sub>test</sub>\r\n</root>', done);
      });
    });
  });
});
