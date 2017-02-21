'use strict';

var _unexpected = require('unexpected');

var _unexpected2 = _interopRequireDefault(_unexpected);

var _vinyl = require('vinyl');

var _vinyl2 = _interopRequireDefault(_vinyl);

var _AtviseFile = require('../../src/lib/server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @test {AtviseFile} */
describe('AtviseFile', function () {
  /** @test {AtviseFile#constructor} */
  describe('#constructor', function () {
    it('should create a vinyl instance', function () {
      const file = new _AtviseFile2.default();

      (0, _unexpected2.default)(file, 'to be a', _vinyl2.default);
    });
  });
});
