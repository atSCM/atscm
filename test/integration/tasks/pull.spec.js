import { join } from 'path';
import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { copy, outputJson, outputFile, readdir, remove } from 'fs-extra';
import { tmpDir } from '../../helpers/util';

const runPull = proxyquire('../../../src/tasks/pull', {
  '../lib/server/NodeBrowser': { default: class PullStub {

    async browse() { return false; }

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

    after(() => {
      process.chdir(originalCwd);
      return remove(projectDir);
    });
  });
});
