/* eslint-disable import/prefer-default-export */

export function sortReferences(references) {
  return Object.keys(references)
    .sort()
    .reduce((sorted, key) => Object.assign(sorted, {
      [key]: Array.isArray(references[key]) ?
        references[key].sort() :
        references[key],
    }), {});
}
