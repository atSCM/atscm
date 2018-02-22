'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = importTask;

var _path = require('path');

var _gulp = require('gulp');

var _ImportStream = require('../lib/gulp/ImportStream');

var _ImportStream2 = _interopRequireDefault(_ImportStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Imports all xml files needed for atscm usage.
 * @return {ImportStream} The import stream used.
 */
function importTask() {
  const srcStream = (0, _gulp.src)((0, _path.join)(__dirname, '../../res/import/scripts', '/**/*.xml'));

  return srcStream.pipe(new _ImportStream2.default());
}

importTask.description = 'Imports all xml resources needed for atscm usage';
//# sourceMappingURL=import.js.map