import { EOL } from 'os';
import expect from 'unexpected';
import { parse as xml2js } from 'modify-xml';
import Transformer, { TransformDirection } from '../../../../src/lib/transform/Transformer';
import XMLTransformer from '../../../../src/lib/transform/XMLTransformer';

function nativeEOLs(string) {
  return string.replace(/\n/g, EOL);
}

/** @test {XMLTransformer} */
describe('XMLTransformer', function () {
  /** @test {XMLTransformer#constructor} */
  describe('#constructor', function () {
    it('should return a SplittingTransformer', function () {
      expect(new XMLTransformer(), 'to be a', Transformer);
    });

    it('should create a _fromDBBuilder', function () {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', 'function');
    });

    it('should create a _fromFilesystemBuilder', function () {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', 'function');
    });
  });

  /** @test {XMLTransformer#builder} */
  describe('#builder', function () {
    it('should return the #_fromDBBuilder if direction is FromDB', function () {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromDB });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromDBBuilder);
    });

    it('should return the #_fromDBBuilder if direction is FromFilesystem', function () {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromFilesystem });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromFilesystemBuilder);
    });

    it('should enforce tag order', function () {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromDB });
      const dom = xml2js(
        `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg>
  <rect x="12" y="13"/>
  <defs>
    <some>defs</some>
  </defs>
  <metadata>
    <some>meta</some>
  </metadata>
  <title>Test</title>
</svg>`,
        { compact: false }
      );
      expect(
        transformer.builder(dom),
        'to equal',
        nativeEOLs(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg>
  <title>Test</title>
  <defs>
    <some>defs</some>
  </defs>
  <metadata>
    <some>meta</some>
  </metadata>
  <rect x="12" y="13"/>
</svg>`)
      );
    });
  });

  /** @test {XMLTransformer#decodeContents} */
  describe.skip('#decodeContents', function () {
    it('should forward errors', function (done) {
      expect(
        (cb) => new XMLTransformer().decodeContents({ contents: 'no valid xml' }, cb),
        'to call the callback with error',
        /Text data outside of root node./
      ).then(() => done());
    });

    it('should return object for valid xml', function (done) {
      expect(
        (cb) => new XMLTransformer().decodeContents({ contents: '<tag>value</tag>' }, cb),
        'to call the callback'
      ).then((args) => {
        expect(args[0], 'to be falsy');
        expect(args[1], 'to equal', {
          elements: [
            {
              type: 'element',
              name: 'tag',
              elements: [
                {
                  type: 'text',
                  text: 'value',
                },
              ],
            },
          ],
        });
        done();
      });
    });
  });

  const baseXmlObject = xml2js(
    `<root>
  <sub>test</sub>
</root>`,
    { compact: false }
  );

  const cdataXmlObject = xml2js(`<svg>
  <script><![CDATA[test();]]></script>
</svg>`);

  function testBuilder(direction, object, expectedResult, callback) {
    const transformer = new XMLTransformer({ direction });

    expect((cb) => transformer.encodeContents(object, cb), 'to call the callback').then((args) => {
      expect(args[0], 'to be falsy');
      expect(args[1], 'to contain', expectedResult);
      callback();
    });
  }

  /** @test {XMLTransformer#encodeContents} */
  describe.skip('#encodeContents', function () {
    it('should forward errors', function () {
      expect(
        (cb) => new XMLTransformer().encodeContents(null, cb),
        'to call the callback with error',
        /Cannot read property/
      );
    });

    context('when direction is FromDB', function () {
      it('should indent with double space', function (done) {
        testBuilder(
          TransformDirection.FromDB,
          baseXmlObject,
          nativeEOLs(`<root>
  <sub>test</sub>
</root>`),
          done
        );
      });
    });

    context('when direction is FromFilesytem', function () {
      it('should indent with single space', function (done) {
        testBuilder(
          TransformDirection.FromFilesystem,
          baseXmlObject,
          '<root>\r\n <sub>test</sub>\r\n</root>',
          done
        );
      });
    });

    it('should support CDATA', function () {
      return expect(
        (cb) =>
          new XMLTransformer({ direction: TransformDirection.FromDB }).encodeContents(
            cdataXmlObject,
            cb
          ),
        'to call the callback'
      ).then((args) =>
        expect(
          args[1],
          'to end with',
          nativeEOLs(`<svg>
  <script><![CDATA[test();]]></script>
</svg>`)
        )
      );
    });

    it("should escape '&' in attribute values", function (done) {
      const xml = nativeEOLs(`<root>
  <node attribute="escape &amp; this"/>
</root>`);
      const xmlObject = xml2js(xml);

      testBuilder(TransformDirection.FromDB, xmlObject, xml, done);
    });

    it("should escape '<' in attribute values", function (done) {
      const xml = nativeEOLs(`<root>
  <node attribute="escape &lt; this"/>
</root>`);
      const xmlObject = xml2js(xml);

      testBuilder(TransformDirection.FromDB, xmlObject, xml, done);
    });
  });
});
