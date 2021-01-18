"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

var _gulp = require("gulp");

var _gulpCompileHandlebars = _interopRequireDefault(require("gulp-compile-handlebars"));

var _handlebarsHelpers = _interopRequireDefault(require("handlebars-helpers"));

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _dependencies = _interopRequireDefault(require("../../res/init/templates/dependencies.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The action run when running "atscm init".
 */
class InitTask {
  /**
   * Returns the globs of the processed files for the given config lanugage.
   * @param {string} langId The configuration language used.
   * @return {string[]} Globs of the files to handle.
   */
  static filesToHandle(langId) {
    return ['./general/**/*', './general/**/.*', `./lang/${langId}/**/*.*`, `./lang/${langId}/**/.*`].map(p => (0, _path.join)(__dirname, '../../res/init/templates', p));
  }
  /**
   * Runs the task with the given options.
   * @param {Object} options The options to use.
   * @return {Promise<{ install: string[] }, Error>} Resolved with information on further actions
   * to run or rejected if the task failed.
   */


  static run(options) {
    const langId = options.configLang;
    const install = _dependencies.default.lang[langId];
    const stream = (0, _gulp.src)(this.filesToHandle(langId), {
      dot: true
    }).pipe((0, _gulpCompileHandlebars.default)(options, {
      helpers: (0, _handlebarsHelpers.default)()
    })).pipe((0, _gulp.dest)('./'));
    return (0, _streamToPromise.default)(stream).then(() => ({
      install
    }));
  }

}

exports.default = InitTask;
//# sourceMappingURL=InitTask.js.map