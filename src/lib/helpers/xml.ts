// Nodes properties

/**
 * Tells if the given parsed XML node is an element (not a text / cdata node).
 * @param {Object} node The parsed node.
 * @return {boolean} `true` if the node has type 'element'.
 */
export function isElement({ type }) {
  return type === 'element';
}

/** Tells if the given parsed XML node is an elment and has the given tag name.
 * @param {Object} node The parsed node.
 * @param {string} tagName The tag name to check for.
 * @return {boolean} `true` if the node is an element with the given tag name.
 */
export function isElementWithName({ type, name }, tagName) {
  return isElement({ type }) && name === tagName;
}

/**
 * Returns a parsed node's text content. Works for 'text' and 'cdata' nodes.
 * @param {Object} node The parsedNode.
 * @return {string?} The nodes text content.
 */
export function textContent(node) {
  if (!node || !node.elements) { return null; }

  const contentNode = node.elements[0];

  // FIXME: Only works for { type: 'text', text: 'value' } and { type: 'cdata', cdata: 'data' }
  return contentNode[contentNode.type];
}

// Traversing nodes

/**
 * Returns a node's child elements with the given tag name.
 * @param {Object} node The node to check in.
 * @param {string|string[]} tagName The tag name to search for. If an array is passed, the tree is
 * traversed.
 * @return {Object[]} The matching child elements.
 */
export function findChildren(node, tagName) {
  if (!node || !node.elements) { return []; }

  if (Array.isArray(tagName)) {
    return tagName.reduce(
      (nodes, name) => nodes.reduce(
        (results, n) => results.concat(findChildren(n, name)),
        []),
      [node]
    );
  }

  return node.elements.filter(child => isElementWithName(child, tagName));
}

/**
 * Returns a node's first child element with the given tag name, or `null`.
 * @param {Object} node The node to check in.
 * @param {string|string[]} tagName The tag name to search for. If an array is passed, the tree is
 * traversed.
 * @return {Object?} The matching child elements.
 */
export function findChild(node, tagName) {
  const gotPath = Array.isArray(tagName);

  if (!node || (!node.elements && !gotPath)) { return null; }

  if (gotPath) {
    if (tagName.length === 0) { return node; }

    const child = findChild(node, tagName[0]);
    const remaining = tagName.slice(1);

    return remaining.length ? findChild(child, remaining) : child;
  }

  for (let i = 0; i < node.elements.length; i++) {
    if (isElementWithName(node.elements[i], tagName)) {
      return node.elements[i];
    }
  }

  return null;
}

// Manipulating nodes

/**
 * Returns and removes a node's child elements with the given tag name.
 * @param {Object} node The node to check in.
 * @param {string} tagName The tag name to search for.
 * @return {Object[]} The matching child elements.
 */
export function removeChildren(node, tagName) {
  if (!node || !node.elements) { return []; }

  const removed = [];

  // eslint-disable-next-line no-param-reassign
  node.elements = node.elements.filter(child => {
    if (isElementWithName(child, tagName)) {
      removed.push(child);
      return false;
    }
    return true;
  });

  return removed;
}

/**
 * Returns and removes a node's first child element with the given tag name, if no match is found
 * `null` is returned.
 * @param {Object} node The node to check in.
 * @param {string} tagName The tag name to search for.
 * @return {Object?} The matching child elements.
 */
export function removeChild(node, tagName) {
  if (!node || !node.elements) { return null; }

  for (let i = 0; i < node.elements.length; i++) {
    if (isElementWithName(node.elements[i], tagName)) {
      return node.elements.splice(i, 1)[0];
    }
  }

  return null;
}

// Creating nodes

/**
 * Creates a new text node.
 * @param {string} [text=''] The node's content.
 * @return {Object} A text node containing the given text.
 */
export function createTextNode(text = '') {
  return { type: 'text', text: text || '' };
}

/**
 * Creates a new CData node.
 * @param {string} [cdata=''] The node's content.
 * @return {Object} A CData node containing the given data.
 */
export function createCDataNode(cdata = '') {
  return { type: 'cdata', cdata };
}

/**
 * Creates a new element node.
 * @param {string} name The node's name.
 * @param {Object[]} [elements=undefined] The child elements to add.
 * @param {Object} [attributes={}] The attributes the new node should have.
 * @return {Object} An element node.
 */
export function createElement(name, elements = undefined, attributes = {}) {
  return { type: 'element', name, elements, attributes };
}

/**
 * Browses a parsed document's tree up starting with the given element.
 * @param {Object} element A parsed XML element.
 * @param {function(element: Object): void} onElement A function called once an element is
 * discovered in the document tree.
 */
function browseUp(element, onElement) {
  let current = element;

  while (current) {
    onElement(current);

    current = current.parent;
  }
}

/**
 * Returns an element's path.
 * @param {Object} element The element to use.
 * @return {string[]} The element's path.
 */
export function elementPath(element) {
  const path = [];

  browseUp(element, ({ name }) => {
    if (name) path.unshift(name);
  });

  return path;
}

/**
 * Returns a string describing an element's path.
 * @param {Object} element Th element to use.
 * @return {string} A description of the element's path.
 */
export function displayPath(element) {
  return elementPath(element).join(' > ︎');
}