'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _gulp = require('gulp');

var _gulpCompileHandlebars = require('gulp-compile-handlebars');

var _gulpCompileHandlebars2 = _interopRequireDefault(_gulpCompileHandlebars);

var _handlebarsHelpers = require('handlebars-helpers');

var _handlebarsHelpers2 = _interopRequireDefault(_handlebarsHelpers);

var _streamToPromise = require('stream-to-promise');

var _streamToPromise2 = _interopRequireDefault(_streamToPromise);

var _dependencies = require('../../res/init/templates/dependencies.json');

var _dependencies2 = _interopRequireDefault(_dependencies);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The action run when running 'atscm init'.
 */
class InitTask {

  /**
   * Returns the globs of the processed files for the given config lanugage.
   * @param {string} langId The configuration language used.
   * @return {String[]} Globs of the files to handle.
   */
  static filesToHandle(langId) {
    return ['./general/**/*', './general/**/.*', `./lang/${langId}/**/*.*`, `./lang/${langId}/**/.*`].map(p => (0, _path.join)(__dirname, '../../res/init/templates', p));
  }

  /**
   * Runs the task with the given options.
   * @param {Object} options The options to use.
   * @return {Promise<{ install: String[] }, Error>} Resolved with information on further actions
   * to run or rejected if the task failed.
   */
  static run(options) {
    const langId = options.configLang;

    const install = _dependencies2.default.lang[langId];

    const stream = (0, _gulp.src)(this.filesToHandle(langId)).pipe((0, _gulpCompileHandlebars2.default)(options, {
      helpers: (0, _handlebarsHelpers2.default)()
    })).pipe((0, _gulp.dest)('./'));

    return (0, _streamToPromise2.default)(stream).then(() => ({ install }));
  }

}
exports.default = InitTask;
//# sourceMappingURL=InitTask.js.map