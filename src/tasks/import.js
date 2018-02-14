import { join } from 'path';
import { src } from 'gulp';
import ImportStream from '../lib/gulp/ImportStream';

/**
 * Imports all xml files needed for atscm usage.
 * @return {ImportStream} The import stream used.
 */
export default function importTask() {
  const srcStream = src(join(__dirname, '../../res/import/scripts', '/**/*.xml'));

  return srcStream
    .pipe(new ImportStream());
}

importTask.description = 'Imports all xml resources needed for atscm usage';
