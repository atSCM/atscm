'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = inspect;

var _util = require('util');

/**
 * Returns a description for the given object.
 * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
 * @param {Object} obj The object to inspect.
 * @param {Object} options The options to use.
 * @param {Number} options.indent The number of characters to use to indent the current line.
 * @return {String} The object's description.
 */
function inspect(obj, options) {
  const indent = options.indent || 0;
  const pad = new Array(indent + 1).join(' ');
  let r = '';

  const nextOptions = Object.assign({}, options, {
    indent: indent + 2,
    depth: options.depth === null ? null : options.depth - 1
  });

  // print class
  if (typeof obj === 'function' && obj.prototype) {
    r += options.stylize(`[class: ${ obj.name }]\n`, 'special');

    Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(n => !['name', 'arguments', 'caller', 'length', 'apply', 'bind', 'call', 'toString', 'constructor', 'prototype', 'inspect'].includes(n)).forEach(n => {
      r += `${ pad }  .${ n }: ${ inspect(obj[n], nextOptions) }\n`;
    });
  } else if (obj instanceof Array) {
    r += '[\n';
    r += obj.map(i => `${ pad }  ${ inspect(i, nextOptions) }\n`).join('');
    r += `${ pad }]`;
  } else if (obj.constructor.name === 'Object') {
    r += "INSPECTING OBJECT";
    r += '{\n';
    r += Object.keys(obj).map(k => `${ pad }  ${ k }: ${ inspect(obj[k], nextOptions) }\n`).join('');
    r += `${ pad }}`;
  } else {
    r += (0, _util.inspect)(obj, nextOptions);
  }

  return r;
}