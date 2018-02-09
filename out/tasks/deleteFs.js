'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = deleteFs;

var _DeleteFsStream = require('../lib/gulp/DeleteFsStream');

var _DeleteFsStream2 = _interopRequireDefault(_DeleteFsStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Deletes listed files from the file system.
 */
function deleteFs(callback) {
  return new _DeleteFsStream2.default({
    deleteFileName: _ProjectConfig2.default.DeleteFileNames.fs
  }).on('close', callback);
}

deleteFs.description = 'Deletes listed files from file system';
//# sourceMappingURL=deleteFs.js.map