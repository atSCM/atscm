'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = importXml;

var _gulp = require('gulp');

var _ImportXmlStream = require('../lib/gulp/ImportXmlStream');

var _ImportXmlStream2 = _interopRequireDefault(_ImportXmlStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Imports all xml files needed for atscm usage.
 */
function importXml() {
  const srcStream = (0, _gulp.src)(_ProjectConfig2.default.RelativeXmlResourcesPath);

  return srcStream.pipe(new _ImportXmlStream2.default());
}

importXml.description = 'Imports all xml resources needed for atscm usage';
//# sourceMappingURL=importXml.js.map