import expect from '../../../expect';
import {
  isElement, isElementWithName,
  findChildren, findChild,
  removeChildren, removeChild,
} from '../../../../src/lib/helpers/xml';

describe('XML helpers', function() {
  /** @test {isElement} */
  describe('isElement', function() {
    it('should return true for element nodes', function() {
      return expect(isElement, 'when called with', [{ type: 'element' }], 'to equal', true);
    });

    it('should return false for text nodes', function() {
      return expect(isElement, 'when called with', [{ type: 'text' }], 'to equal', false);
    });
  });

  /** @test {isElementWithName} */
  describe('isElementWithName', function() {
    it('should return false for non-element nodes', function() {
      return expect(isElementWithName, 'when called with', [{ type: 'text' }, 'elementname'],
        'to equal', false);
    });

    it('should return false for non-matching elements', function() {
      return expect(isElementWithName, 'when called with',
        [{ type: 'element', name: 'another' }, 'elementname'],
        'to equal', false);
    });

    it('should return true for matching elements', function() {
      return expect(isElementWithName, 'when called with',
        [{ type: 'element', name: 'elementname' }, 'elementname'],
        'to equal', true);
    });
  });

  /** @test {findChildren} */
  describe('findChildren', function() {
    it('should return empty array for non-elements', function() {
      return expect(findChildren, 'when called with', [{ type: 'text' }, 'elementname'],
        'to equal', []);
    });

    it('should empty array for text content nodes', function() {
      return expect(findChildren, 'when called with', [{
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
      return expect(findChildren, 'when called with', [{
        type: 'element',
        elements: [
          { type: 'element', name: 'another' },
          matching,
        ],
      }, 'elementname'],
      'to equal', [matching]);
    });
  });

  /** @test {findChild} */
  describe('findChild', function() {
    it('should return null for non-elements', function() {
      return expect(findChild, 'when called with', [{ type: 'text' }, 'elementname'],
        'to equal', null);
    });

    it('should null for text content nodes', function() {
      return expect(findChild, 'when called with', [{
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
      return expect(findChild, 'when called with', [{
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

  /** @test {removeChildren} */
  describe('removeChildren', function() {
    it('should return empty array for non-elements', function() {
      return expect(removeChildren, 'when called with', [{ type: 'text' }, 'elementname'],
        'to equal', []);
    });

    it('should empty array for text content nodes', function() {
      return expect(removeChildren, 'when called with', [{
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

      await expect(removeChildren, 'when called with', [node, 'elementname'],
        'to equal', [matching]);

      // Should remove match from elements array
      expect(node.elements.length, 'to equal', 1);
      expect(node.elements.includes(matching), 'to be', false);
    });
  });

  /** @test {removeChild} */
  describe('removeChild', function() {
    it('should return null for non-elements', function() {
      return expect(removeChild, 'when called with', [{ type: 'text' }, 'elementname'],
        'to equal', null);
    });

    it('should null for text content nodes', function() {
      return expect(removeChild, 'when called with', [{
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

      await expect(removeChild, 'when called with', [node, 'elementname'], 'to equal', matching);

      // Should remove match from elements array
      expect(node.elements.length, 'to equal', 2);
      expect(node.elements.includes(matching), 'to be', false);
    });
  });
});
