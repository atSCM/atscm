import { join } from 'path';
import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { ctor as makeStreamConstructor } from 'through2';
import { copy, outputJson, outputFile, readdir } from 'fs-extra';
import { tmpDir } from '../../helpers/util';

const StreamConstructor = makeStreamConstructor({ objectMode: true }, (chunk, _, callback) => {
  callback(new Error('Test'));
});

const runPull = proxyquire('../../../src/tasks/pull', {
  '../lib/server/NodeStream': { default: StreamConstructor },
  '../lib/gulp/PullStream': { default: class PullStub extends StreamConstructor {

    constructor(...args) {
      super(...args);

      setTimeout(() => this.emit('end'), 100);
    }

  } },
}).default;

describe('pull task', function() {
  context('with the `--clean` flag', function() {
    const projectDir = tmpDir('pull-clean');
    const sourceDir = join(projectDir, 'src');
    const testFile = join(sourceDir, 'file-that-exists.txt');

    const originalCwd = process.cwd();

    before(() => Promise.all([
      copy(
        join(__dirname, '../../fixtures/Atviseproject.babel.js'),
        join(projectDir, 'Atviseproject.babel.js')),
      outputJson(join(projectDir, 'package.json'), {}),
      outputFile(testFile, 'Testing...'),
    ])
      .then(() => process.chdir(projectDir)));

    it('should empty the source directory first', function() {
      return expect(readdir(sourceDir), 'when fulfilled', 'not to be empty')
        .then(() => runPull({ clean: true }))
        .then(() => expect(readdir(sourceDir), 'when fulfilled', 'to be empty'));
    });

    after(() => process.chdir(originalCwd));
  });
});
