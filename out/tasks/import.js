"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = importTask;

var _gulp = require("gulp");

var _serverScripts = _interopRequireDefault(require("@atscm/server-scripts"));

var _ImportStream = _interopRequireDefault(require("../lib/gulp/ImportStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Imports all xml files needed for atscm usage.
 * @return {ImportStream} The import stream used.
 */
function importTask() {
  const srcStream = (0, _gulp.src)(_serverScripts.default);
  return srcStream.pipe(new _ImportStream.default());
}

importTask.description = 'Imports all xml resources needed for atscm usage';
//# sourceMappingURL=import.js.map