"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "pull", {
  enumerable: true,
  get: function () {
    return _pull.default;
  }
});
Object.defineProperty(exports, "push", {
  enumerable: true,
  get: function () {
    return _push.default;
  }
});
Object.defineProperty(exports, "watch", {
  enumerable: true,
  get: function () {
    return _watch.default;
  }
});
Object.defineProperty(exports, "import", {
  enumerable: true,
  get: function () {
    return _import.default;
  }
});

var _nodeCleanup = _interopRequireDefault(require("node-cleanup"));

var _cleanup = _interopRequireDefault(require("./util/cleanup"));

var _pull = _interopRequireDefault(require("./tasks/pull"));

var _push = _interopRequireDefault(require("./tasks/push"));

var _watch = _interopRequireDefault(require("./tasks/watch"));

var _import = _interopRequireDefault(require("./tasks/import"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Register tasks
// Register cleanup

/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  // Prevent node-opcua logging
  console.log = () => {}; // eslint-disable-line no-console


  (0, _nodeCleanup.default)((code, signal) => (0, _cleanup.default)(code, signal, _nodeCleanup.default.uninstall), {
    ctrl_C: '',
    unhandledRejection: ''
  });
}
//# sourceMappingURL=Gulpfile.js.map