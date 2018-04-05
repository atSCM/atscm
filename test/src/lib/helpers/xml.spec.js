import { js2xml } from 'xml-js';
import expect from '../../../expect';
import {
  isElement, isElementWithName,
  findChildren, findChild,
  removeChildren, removeChild,
  createTextNode, createCDataNode, createElement,
} from '../../../../src/lib/helpers/xml';

function build(node) {
  return js2xml({ elements: [node] });
}

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

    context('with a tag path', function() {
      it('should traverse the node tree', async function() {
        const targets = [createElement('target'), createElement('target')];
        const doc = createElement('root', [
          createElement('child', [
            targets[0],
          ]),
          createElement('child', [
            targets[1],
          ]),
        ]);

        return expect(findChildren, 'when called with', [doc, ['child', 'target']],
          'to contain', ...targets);
      });

      it('should only return exact matches', function() {
        const targets = new Array(3).fill().map(() => createElement('target'));
        const doc = createElement('root', [
          createElement('child', [
            targets[0],
            createElement('subchild', [targets[1]]),
          ]),
          targets[2],
        ]);

        return expect(findChildren, 'when called with', [doc, ['child', 'target']],
          'to have items satisfying', 'to be', targets[0]);
      });
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

    context('with a tag path', function() {
      it('should traverse the node tree', function() {
        const target = createElement('target');

        return expect(findChild, 'when called with', [createElement('root', [
          createElement('child', [
            target,
          ]),
        ]), ['child', 'target']],
        'to be', target);
      });

      it('should return source without elements', function() {
        const root = createElement('root');
        return expect(findChild, 'when called with', [root, []], 'to be', root);
      });

      it('should return first match only ', function() {
        const target = createElement('target');

        return expect(findChild, 'when called with', [createElement('root', [
          createElement('child', [
            target,
            createElement('target'),
          ]),
        ]), ['child', 'target']],
        'to be', target);
      });
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

  /** @test {createTextNode} */
  describe('createTextNode', function() {
    it('should return a text node with the given text', function() {
      return expect(build(createTextNode('testing')), 'to equal', 'testing');
    });

    it('should create an empty node with no text', function() {
      return expect(build(createTextNode()), 'to equal', '');
    });
  });

  /** @test {createCDataNode} */
  describe('createCDataNode', function() {
    it('should return a cdata node with the given content', function() {
      return expect(build(createCDataNode('testing')), 'to equal', '<![CDATA[testing]]>');
    });

    it('should create an empty node with no content', function() {
      return expect(build(createCDataNode()), 'to equal', '<![CDATA[]]>');
    });
  });

  /** @test {createElement} */
  describe('createElement', function() {
    it('should return an element node with no additional args', function() {
      return expect(build(createElement('testing')), 'to equal', '<testing/>');
    });

    it('should add child elements if provided', function() {
      return expect(build(createElement('testing', [
        createElement('child'),
      ])), 'to equal', '<testing><child/></testing>');
    });

    it('should add attributes if provided', function() {
      return expect(build(createElement('testing', undefined, {
        attr: 'value',
      })), 'to equal', '<testing attr="value"/>');
    });

    it('should add children and attributes if provided', function() {
      return expect(build(createElement('testing', [
        createElement('child'),
      ], {
        attr: 'value',
      })), 'to equal', '<testing attr="value"><child/></testing>');
    });
  });
});
