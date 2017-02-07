import { join } from 'path';
import { src, dest } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import helpers from 'handlebars-helpers';
import streamToPromise from 'stream-to-promise';

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

    // eslint-disable-next-line global-require
    const install = require(join(__dirname, '../../res/init/templates/dependencies.json'))
      .lang[langId];

    const stream = src(this.filesToHandle(langId))
      .pipe(handlebars(options, {
        helpers: helpers(),
      }))
      .pipe(dest('./'));

    return streamToPromise(stream)
      .then(() => ({ install }));
  }

}
