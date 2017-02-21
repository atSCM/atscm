'use strict';

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _Gulpfile = require('../src/Gulpfile');

var _Gulpfile2 = _interopRequireDefault(_Gulpfile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('test', function () {
  it('should be run', function () {
    (0, _unexpected2.default)(true, 'to be true');
  });
});

describe('Task', function () {
  describe('default', function () {
    it('should exist', function () {
      (0, _unexpected2.default)((0, _Gulpfile2.default)(), 'to equal', 'config');
    });
  });
});