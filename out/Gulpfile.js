'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.watch = exports.push = exports.pull = undefined;

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

var _nodeCleanup = require('node-cleanup');

var _nodeCleanup2 = _interopRequireDefault(_nodeCleanup);

var _cleanup = require('./util/cleanup');

var _cleanup2 = _interopRequireDefault(_cleanup);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Register cleanup
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  (0, _nodeCleanup2.default)((code, signal) => (0, _cleanup2.default)(code, signal, _nodeCleanup2.default.uninstall), {
    ctrl_C: '',
    unhandledRejection: ''
  });
}