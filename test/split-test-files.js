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
    .map(a => a.join(' '));

  await mkdir(join(__dirname, '.chunks'));

  await Promise.all(contents
    .map((content, index) => writeFile(
      join(__dirname, `.chunks/testfiles-${index + 1}.txt`),
      content,
      'utf8',
    ))
  );

  return chunks(files, parallelism);
}

splitTestFiles('test/src/**/*.spec.js', 4);
