'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pull = require('./tasks/pull');

Object.defineProperty(exports, 'pull', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_pull).default;
  }
});

var _push = require('./tasks/push');

Object.defineProperty(exports, 'push', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_push).default;
  }
});

var _watch = require('./tasks/watch');

Object.defineProperty(exports, 'watch', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_watch).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }