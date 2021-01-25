import { join } from 'path';
import { src, dest } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import helpers from 'handlebars-helpers';
import streamToPromise from 'stream-to-promise';
import through from 'through2';
import deps from '../../res/init/templates/dependencies.json';

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
        file.basename = '.gitignore';
      }

      callback(null, file);
    });

    const stream = src(this.filesToHandle(langId), { dot: true })
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
