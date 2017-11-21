'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deleteServer;

var _DeleteServerStream = require('../lib/gulp/DeleteServerStream');

var _DeleteServerStream2 = _interopRequireDefault(_DeleteServerStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Deletes listed atvise server nodes.
 */
function deleteServer(callback) {
  return new _DeleteServerStream2.default({
    deleteFileName: _ProjectConfig2.default.DeleteFileNames.server
  }).on('finish', callback);
}

deleteServer.description = 'Deletes listed nodes from atvise server';
//# sourceMappingURL=deleteServer.js.map