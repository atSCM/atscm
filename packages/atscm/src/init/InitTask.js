import { join } from 'path';
import { src, dest } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import replace from 'gulp-replace';
import helpers from 'handlebars-helpers';
import streamToPromise from 'stream-to-promise';
import through from 'through2';
import camelCase from 'camelcase';
import deps from '../../res/init/templates/dependencies.json';

/**
 * Converts a string to pascal case.
 * @param {string} str The string to convert.
 */
const pascalCase = (str) => camelCase(str, { pascalCase: true });

/**
 * Converts a value to a valid JavaScript literal.
 * @param {any} value The value to convert.
 */
const toLiteral = (value) =>
  ({
    string: `'${value}'`,
  }[typeof value] || JSON.stringify(value));

/**
 * The action run when running "atscm init".
 */
export default class InitTask {
  /**
   * Returns the globs of the processed files for the given config lanugage.
   * @param {string} langId The configuration language used.
   * @return {string[]} Globs of the files to handle.
   */
  static filesToHandle(langId) {
    return [
      './general/**/*',
      './general/**/.*',
      `./lang/${langId}/**/*.*`,
      `./lang/${langId}/**/.*`,
    ].map((p) => join(__dirname, '../../res/init/templates', p));
  }

  /**
   * Runs the task with the given options.
   * @param {Object} options The options to use.
   * @return {Promise<{ install: string[] }, Error>} Resolved with information on further actions
   * to run or rejected if the task failed.
   */
  static async run(options) {
    const langId = options.configLang;

    const install = deps.lang[langId];

    const renameGitignore = through.obj((file, _, callback) => {
      if (file.basename === 'gitignore') {
        // eslint-disable-next-line no-param-reassign
        file.basename = '.gitignore';
      }

      callback(null, file);
    });

    const stream = src(this.filesToHandle(langId), { dot: true })
      .pipe(replace(/[\s\S]*\/\/\* start output\s*/, ''))
      .pipe(replace('__CONFIG_CLASS_NAME__', pascalCase(options.name)))
      .pipe(replace(/\/\/\*\s?/g, ''))
      .pipe(replace(/__INIT__.([a-z]+)/gi, (_, name) => toLiteral(options[name])))
      .pipe(renameGitignore)
      .pipe(
        handlebars(options, {
          helpers: helpers(),
        })
      )
      .pipe(dest('./'));

    await streamToPromise(stream);

    return { install };
  }
}
