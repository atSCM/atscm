import { mkdir } from 'fs';
import { join } from 'path';
import rmdir from 'rimraf';

/**
 * Creates a new temporary directory and runs `run` with it's path.
 * @param {function(path: String)} run The action to run in the temporary directory.
 */
export default function inTmpDir(run) {
  const path = join(__dirname, `../tmp_${new Date().getTime()}`);

  before((done) => mkdir(path, done));
  after((done) => rmdir(path, done));

  run(path);
}
