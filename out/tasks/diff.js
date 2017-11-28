'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = diff;

var _DiffStream = require('../lib/gulp/DiffStream');

var _DiffStream2 = _interopRequireDefault(_DiffStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates diff between atvise server process image and mapped files.
 */
function diff() {
  return new _DiffStream2.default({
    nodesToDiff: _ProjectConfig2.default.nodes,
    filePath: _ProjectConfig2.default.DiffFileName
  });
}

diff.description = 'Creates diff between mapped file system nodes and atvise server nodes';
//# sourceMappingURL=diff.js.map