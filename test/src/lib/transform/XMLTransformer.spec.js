import expect from 'unexpected';
// import { Builder } from 'xml2js';
import { xml2js } from 'xml-js';
import Transformer, { TransformDirection } from '../../../../src/lib/transform/Transformer';
import XMLTransformer from '../../../../src/lib/transform/XMLTransformer';

/** @test {XMLTransformer} */
describe('XMLTransformer', function() {
  /** @test {XMLTransformer#constructor} */
  describe('#constructor', function() {
    it('should return a SplittingTransformer', function() {
      expect(new XMLTransformer(), 'to be a', Transformer);
    });

    it('should create a _fromDBBuilder', function() {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', 'function');
    });

    it('should create a _fromFilesystemBuilder', function() {
      const transformer = new XMLTransformer();

      expect(transformer._fromDBBuilder, 'to be defined');
      expect(transformer._fromDBBuilder, 'to be a', 'function');
    });
  });

  /** @test {XMLTransformer#builder} */
  describe('#builder', function() {
    it('should return the #_fromDBBuilder if direction is FromDB', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromDB });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromDBBuilder);
    });

    it('should return the #_fromDBBuilder if direction is FromFilesystem', function() {
      const transformer = new XMLTransformer({ direction: TransformDirection.FromFilesystem });

      expect(transformer.builder, 'to be defined');
      expect(transformer.builder, 'to be', transformer._fromFilesystemBuilder);
    });
  });

  /** @test {XMLTransformer#decodeContents} */
  describe('#decodeContents', function() {
    it('should forward errors', function(done) {
      expect(cb => (new XMLTransformer()).decodeContents({ contents: 'no valid xml' }, cb),
        'to call the callback with error', /Text data outside of root node./)
        .then(() => done());
    });

    it('should return object for valid xml', function(done) {
      expect(cb => (new XMLTransformer()).decodeContents({ contents: '<tag>value</tag>' }, cb),
        'to call the callback')
        .then(args => {
          expect(args[0], 'to be falsy');
          expect(args[1], 'to equal', { elements: [{
            type: 'element',
            name: 'tag',
            elements: [{
              type: 'text',
              text: 'value',
            }],
          }] });
          done();
        });
    });
  });

  const baseXmlObject = xml2js(`<root>
  <sub>test</sub>
</root>`, { compact: false });

  const cdataXmlObject = xml2js(`<svg>
  <script><![CDATA[test();]]></script>
</svg>`);

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
      expect(cb => (new XMLTransformer()).encodeContents(null, cb),
        'to call the callback with error', /Cannot read property/);
    });

    context('when direction is FromDB', function() {
      it('should indent with double space', function(done) {
        testBuilder(TransformDirection.FromDB, baseXmlObject,
          `<root>
  <sub>test</sub>
</root>`, done);
      });
    });

    context('when direction is FromFilesytem', function() {
      it('should indent with single space', function(done) {
        testBuilder(TransformDirection.FromFilesystem, baseXmlObject,
          '<root>\r\n <sub>test</sub>\r\n</root>', done);
      });
    });

    it('should support CDATA', function() {
      return expect(cb => (new XMLTransformer({ direction: TransformDirection.FromDB }))
        .encodeContents(cdataXmlObject, cb), 'to call the callback')
        .then(args => expect(args[1], 'to end with', `<svg>
  <script><![CDATA[test();]]></script>
</svg>`));
    });

    it('should escape \'&\' in attribute values', function(done) {
      const xml = `<root>
  <node attribute="escape &amp; this"/>
</root>`;
      const xmlObject = xml2js(xml);

      testBuilder(TransformDirection.FromDB, xmlObject, xml, done);
    });

    it('should escape \'<\' in attribute values', function(done) {
      const xml = `<root>
  <node attribute="escape &lt; this"/>
</root>`;
      const xmlObject = xml2js(xml);

      testBuilder(TransformDirection.FromDB, xmlObject, xml, done);
    });
  });

  describe('DOM helpers', function() {
    /** @test {XMLTransformer#isElement} */
    describe('#isElement', function() {
      it('should return true for element nodes', function() {
        return expect(XMLTransformer.prototype.isElement, 'when called with', [{ type: 'element' }],
          'to equal', true);
      });

      it('should return false for text nodes', function() {
        return expect(XMLTransformer.prototype.isElement, 'when called with', [{ type: 'text' }],
          'to equal', false);
      });
    });

    /** @test {XMLTransformer#isElementWithName} */
    describe('#isElementWithName', function() {
      it('should return false for non-element nodes', function() {
        return expect(XMLTransformer.prototype.isElementWithName.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'text' }, 'elementname'],
          'to equal', false);
      });

      it('should return false for non-matching elements', function() {
        return expect(XMLTransformer.prototype.isElementWithName.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'element', name: 'another' }, 'elementname'],
          'to equal', false);
      });

      it('should return true for matching elements', function() {
        return expect(XMLTransformer.prototype.isElementWithName.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'element', name: 'elementname' }, 'elementname'],
          'to equal', true);
      });
    });

    /** @test {XMLTransformer#findChildren} */
    describe('#findChildren', function() {
      it('should return empty array for non-elements', function() {
        return expect(XMLTransformer.prototype.findChildren.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'text' }, 'elementname'],
          'to equal', []);
      });

      it('should empty array for text content nodes', function() {
        return expect(XMLTransformer.prototype.findChildren.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'text', text: 'just text' },
            ],
          }, 'elementname'],
          'to equal', []);
      });

      it('should filter child elements', function() {
        const matching = {
          type: 'element',
          name: 'elementname',
        };
        return expect(XMLTransformer.prototype.findChildren.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'element', name: 'another' },
              matching,
            ],
          }, 'elementname'],
          'to equal', [matching]);
      });
    });

    /** @test {XMLTransformer#findChild} */
    describe('#findChild', function() {
      it('should return null for non-elements', function() {
        return expect(XMLTransformer.prototype.findChild.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'text' }, 'elementname'],
          'to equal', null);
      });

      it('should null for text content nodes', function() {
        return expect(XMLTransformer.prototype.findChild.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'text', text: 'just text' },
            ],
          }, 'elementname'],
          'to equal', null);
      });

      it('should return first matching child elements', function() {
        const matching = {
          type: 'element',
          name: 'elementname',
        };
        return expect(XMLTransformer.prototype.findChild.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'element', name: 'another' },
              matching,
              { type: 'element', name: 'elementname', elements: [] },
            ],
          }, 'elementname'],
          'to equal', matching);
      });
    });

    /** @test {XMLTransformer#findChildren} */
    describe('#removeChildren', function() {
      it('should return empty array for non-elements', function() {
        return expect(XMLTransformer.prototype.removeChildren.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'text' }, 'elementname'],
          'to equal', []);
      });

      it('should empty array for text content nodes', function() {
        return expect(XMLTransformer.prototype.removeChildren.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'text', text: 'just text' },
            ],
          }, 'elementname'],
          'to equal', []);
      });

      it('should filter child elements', async function() {
        const matching = {
          type: 'element',
          name: 'elementname',
        };

        const node = {
          type: 'element',
          elements: [
            { type: 'element', name: 'another' },
            matching,
          ],
        };

        await expect(XMLTransformer.prototype.removeChildren.bind(XMLTransformer.prototype),
          'when called with', [node, 'elementname'],
          'to equal', [matching]);

        // Should remove match from elements array
        expect(node.elements.length, 'to equal', 1);
        expect(node.elements.includes(matching), 'to be', false);
      });
    });

    /** @test {XMLTransformer#removeChild} */
    describe('#removeChild', function() {
      it('should return null for non-elements', function() {
        return expect(XMLTransformer.prototype.removeChild.bind(XMLTransformer.prototype),
          'when called with', [{ type: 'text' }, 'elementname'],
          'to equal', null);
      });

      it('should null for text content nodes', function() {
        return expect(XMLTransformer.prototype.removeChild.bind(XMLTransformer.prototype),
          'when called with', [{
            type: 'element',
            elements: [
              { type: 'text', text: 'just text' },
            ],
          }, 'elementname'],
          'to equal', null);
      });

      it('should return first matching child elements', async function() {
        const matching = {
          type: 'element',
          name: 'elementname',
        };

        const node = {
          type: 'element',
          elements: [
            { type: 'element', name: 'another' },
            matching,
            { type: 'element', name: 'elementname', elements: [] },
          ],
        };

        await expect(XMLTransformer.prototype.removeChild.bind(XMLTransformer.prototype),
          'when called with', [node, 'elementname'],
          'to equal', matching);

        // Should remove match from elements array
        expect(node.elements.length, 'to equal', 2);
        expect(node.elements.includes(matching), 'to be', false);
      });
    });
  });
});
