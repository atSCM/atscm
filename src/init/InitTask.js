import { join } from 'path';
import { src, dest } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import helpers from 'handlebars-helpers';
import streamToPromise from 'stream-to-promise';
import deps from '../../res/init/templates/dependencies.json';

export default class InitTask {

  static filesToHandle(langId) {
    return [
      './general/**/*',
      './general/**/.*',
      `./lang/${langId}/**/*.*`,
      `./lang/${langId}/**/.*`,
    ].map(p => join(__dirname, '../../res/init/templates', p));
  }

  static run(options) {
    const langId = options.configLang;

    const install = deps.lang[langId];

    const stream = src(this.filesToHandle(langId))
      .pipe(handlebars(options, {
        helpers: helpers(),
      }))
      .pipe(dest('./'));

    return streamToPromise(stream)
      .then(() => ({ install }));
  }

}
