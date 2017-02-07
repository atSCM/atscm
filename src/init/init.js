import { join } from 'path';
import { src, dest } from 'gulp';
import handlebars from 'gulp-compile-handlebars';
import helpers from 'handlebars-helpers';
import streamToPromise from 'stream-to-promise';
import { obj as createStream } from 'through2';

export class InitTask {

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
      .pipe(createStream((chunk, enc, callback) => {
        console.log('> handling', chunk.relative);
        callback(null, chunk);
      }))
      .pipe(handlebars(options, {
        helpers: helpers(),
      }))
      .pipe(dest('./'));

    return streamToPromise(stream)
      .then(() => ({ install }));
  }

}

export default InitTask.run;

//
// export default function(options) {
//   const langId = ConfigLangs[options.configLang];
//   // eslint-disable-next-line global-require
//   const install = require(join(__dirname, '../../res/init/templates/dependencies.json'))
//     .lang[langId];
//
//   const stream = src([
//     './general/**/*',
//     './general/**/.*',
//     `./lang/${langId}/**/*.*`,
//     `./lang/${langId}/**/.*`,
//   ].map(p => join(__dirname, '../../res/init/templates', p)))
//     .pipe(handlebars(options, {
//       helpers: helpers(),
//     }))
//     .pipe(dest('./'));
//
//   return streamToPromise(stream)
//     .then(() => ({ install }));
// }
