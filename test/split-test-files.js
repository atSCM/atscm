/* eslint-disable import/no-commonjs */

const { join } = require('path');
const { mkdir: _mkdir, writeFile: _writeFile } = require('fs');
const { promisify } = require('util');
const globby = require('globby');

const writeFile = promisify(_writeFile);
const mkdir = promisify(_mkdir);

function chunks(array, length) {
  const chunkLength = Math.ceil(array.length / length);

  return Array(length).fill()
    .map(() => array.splice(0, chunkLength));
}

async function splitTestFiles(pattern, parallelism) {
  const files = await globby(pattern);

  const contents = chunks(files, parallelism)
    .map(a => a.concat(join('', 'test/src/maintenance.spec.js')).join(' '));

  try {
    await mkdir(join(__dirname, '.chunks'));
  } catch (e) { } // eslint-disable-line no-empty

  await Promise.all(contents
    .map((content, index) => writeFile(
      join(__dirname, `.chunks/testfiles-${index}.txt`),
      content,
      'utf8',
    ))
  );

  return contents;
}

/* eslint-disable no-console */
splitTestFiles('test/src/**/*.spec.js', 4)
  .then(contents => console.log(`Created ${contents.length} chunks`))
  .catch(e => console.error('Creating chunks failed', e));
