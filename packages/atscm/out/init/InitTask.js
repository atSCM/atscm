"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = require("path");

var _gulp = require("gulp");

var _gulpCompileHandlebars = _interopRequireDefault(require("gulp-compile-handlebars"));

var _gulpReplace = _interopRequireDefault(require("gulp-replace"));

var _handlebarsHelpers = _interopRequireDefault(require("handlebars-helpers"));

var _streamToPromise = _interopRequireDefault(require("stream-to-promise"));

var _through = _interopRequireDefault(require("through2"));

var _camelcase = _interopRequireDefault(require("camelcase"));

var _dependencies = _interopRequireDefault(require("../../res/init/templates/dependencies.json"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Converts a string to pascal case.
 * @param {string} str The string to convert.
 */
const pascalCase = str => (0, _camelcase.default)(str, {
  pascalCase: true
});
/**
 * Converts a value to a valid JavaScript literal.
 * @param {any} value The value to convert.
 */


const toLiteral = value => ({
  string: `'${value}'`
})[typeof value] || JSON.stringify(value);
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


  static async run(options) {
    const langId = options.configLang;
    const install = _dependencies.default.lang[langId];

    const renameGitignore = _through.default.obj((file, _, callback) => {
      if (file.basename === 'gitignore') {
        // eslint-disable-next-line no-param-reassign
        file.basename = '.gitignore';
      }

      callback(null, file);
    });

    const stream = (0, _gulp.src)(this.filesToHandle(langId), {
      dot: true
    }).pipe((0, _gulpReplace.default)(/[\s\S]*\/\/\* start output\s*/, '')).pipe((0, _gulpReplace.default)('__CONFIG_CLASS_NAME__', pascalCase(options.name))).pipe((0, _gulpReplace.default)(/\/\/\*\s?/g, '')).pipe((0, _gulpReplace.default)(/__INIT__.([a-z]+)/gi, (_, name) => toLiteral(options[name]))).pipe(renameGitignore).pipe((0, _gulpCompileHandlebars.default)(options, {
      helpers: (0, _handlebarsHelpers.default)()
    })).pipe((0, _gulp.dest)('./'));
    await (0, _streamToPromise.default)(stream);
    return {
      install
    };
  }

}

exports.default = InitTask;
//# sourceMappingURL=InitTask.js.map