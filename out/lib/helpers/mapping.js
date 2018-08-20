"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sortReferences = sortReferences;
/* eslint-disable import/prefer-default-export */

/**
 * Sorts the given references before they are persisted to disk.
 * @param {Object} references The references to be sorted.
 */
function sortReferences(references) {
  return Object.keys(references).sort().reduce((sorted, key) => Object.assign(sorted, {
    [key]: Array.isArray(references[key]) ? references[key].sort() : references[key]
  }), {});
}
//# sourceMappingURL=mapping.js.map