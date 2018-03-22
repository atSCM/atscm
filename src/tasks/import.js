import { join } from 'path';
import { src } from 'gulp';
import scripts from '@atscm/server-scripts';
import ImportStream from '../lib/gulp/ImportStream';

/**
 * Imports all xml files needed for atscm usage.
 * @return {ImportStream} The import stream used.
 */
export default function importTask() {
  const srcStream = src(scripts);

  return srcStream
    .pipe(new ImportStream());
}

importTask.description = 'Imports all xml resources needed for atscm usage';
