import { readdir, writeFileSync } from 'fs';
import { join } from 'path';
import Emitter from 'events';
import expect from 'unexpected';
import { spy, stub } from 'sinon';
import proxyquire from 'proxyquire';
import inTmpDir from '../../helpers/inTmpDir';
import atscmPkg from '../../fixtures/node_modules/atscm/package.json';

class StubPipe extends Emitter {}

class StubProcess extends Emitter {

  constructor() {
    super();

    this.stdout = new StubPipe();
    this.stderr = new StubPipe();
  }

  close(code) {
    this.emit('close', code);
  }

}

const stubModulePath = join(__dirname, 'stub.js');

function createImportStub(func, noCallThru = true) {
  return {
    __esModule: true,
    default: spy(func),
    '@noCallThru': noCallThru,
  };
}

const stubProcessEmitter = new Emitter();
const spawnStub = spy(() => {
  const process = new StubProcess();

  stubProcessEmitter.emit('new', process);

  return process;
});

const fsStub = {
  readdir: spy(readdir),
};
let whichStub = createImportStub((name, cb) => cb(null, name));
const initStub = createImportStub(() => Promise.resolve());
const promptSpy = spy(() => Promise.resolve({}));
const stubInitOptions = [
  { name: 'test', default: 13 },
];

const InitCommand = proxyquire('../../../src/cli/commands/Init', {
  fs: fsStub,
  inquirer: {
    prompt: promptSpy,
  },
  child_process: {
    __esModule: true,
    spawn: spawnStub,
    '@noCallThru': true,
  },
  which: whichStub,
  [join(stubModulePath, '../init/options')]: {
    __esModule: true,
    default: stubInitOptions,
    '@noCallThru': true,
  },
  [join(stubModulePath, '../init/init')]: initStub,
}).default;

/** @test {InitCommand} */
describe('InitCommand', function() {
  const command = new InitCommand('init', 'Creates a new project.');

  /** @test {InitCommand#checkDirectory} */
  describe('#checkDirectory', function() {
    inTmpDir(path => {
      it('should fail if directory does not exist', function() {
        return expect(command.checkDirectory('./not/existant'),
          'to be rejected with', /does not exist$/);
      });

      it('should fail if path is not a directory', function() {
        return expect(command.checkDirectory(join(__dirname, './Init.spec.js')),
          'to be rejected with', /is not a directory$/);
      });

      it('should fail if directory is not empty', function() {
        return expect(command.checkDirectory(__dirname),
          'to be rejected with', /is not empty$/);
      });

      it('should work with empty dir', function() {
        return expect(command.checkDirectory(path), 'to be fulfilled');
      });

      it('should work in non-empty dir with overwrite set', function() {
        writeFileSync(join(path, 'file.txt'), 'data');

        return expect(command.checkDirectory(path, true), 'to be fulfilled');
      });
    });

    context('when non-ENOENT and ENOTDIR occurres', function() {
      const orgReaddir = fsStub.readdir;

      before(() => (fsStub.readdir = spy((path, cb) => cb(new Error('Any other error')))));
      after(() => (fsStub.readdir = orgReaddir));

      it('should fail with original error', function() {
        return expect(command.checkDirectory('path'),
          'to be rejected with', 'Any other error'
        );
      });
    });
  });

  /** @test {InitCommand#createEmptyPackage} */
  describe('#createEmptyPackage', function() {
    inTmpDir(path => {
      it('should fail with invalid path', function() {
        return expect(command.createEmptyPackage('path/that/does/not/exist'),
          'to be rejected with', /^Unable to create package.json at/);
      });

      it('should work in empty directory', function() {
        return expect(command.createEmptyPackage(path), 'to be fulfilled')
          .then(() => {
            let pkg;
            // eslint-disable-next-line global-require
            expect(() => (pkg = require(join(path, 'package.json'))), 'not to throw');
            expect(pkg, 'to equal', {});
          });
      });
    });
  });

  /** @test {InitCommand#install} */
  describe('#install', function() {
    beforeEach(() => whichStub.default.resetHistory());

    it('should run which for npm', function() {
      const deps = ['dep1', 'dep2'];

      stubProcessEmitter.once('new', proc => {
        setTimeout(() => proc.close(0), 10);
      });

      return expect(
        command.install(stubModulePath, deps),
        'to be fulfilled'
      )
        .then(() => {
          expect(whichStub.default.calledOnce, 'to be', true);
          expect(whichStub.default.lastCall.args[0], 'to equal', 'npm');
        });
    });

    it('should forward errors occuring in npm', function() {
      const error = new Error('Test');

      stubProcessEmitter.once('new', proc => {
        setTimeout(() => proc.emit('error', error), 10);
      });

      return expect(
        command.install(stubModulePath, ['dep']),
        'to be rejected with', error
      );
    });

    it('should report error if npm fails', function() {
      const code = Math.round(Math.random() * 100) + 1;

      stubProcessEmitter.once('new', proc => {
        setTimeout(() => proc.close(code), 10);
      });

      return expect(
        command.install(stubModulePath, ['dep']),
        'to be rejected with', `npm install returned code ${code}`
      );
    });

    context('when npm is not installed', function() {
      const orgWhichStub = whichStub.default;

      before(() => (whichStub.default = spy((name, cb) => cb(new Error('A which error')))));
      after(() => (whichStub.default = orgWhichStub));

      it('should fail', function() {
        whichStub = spy((name, cb) => cb(new Error('A which error')));

        return expect(
          command.install(stubModulePath, ['dep']),
          'to be rejected with', 'A which error'
        );
      });
    });
  });

  /** @test {InitCommand#installLocal} */
  describe('#installLocal', function() {
    beforeEach(() => stub(command, 'runNpm').callsFake(() => Promise.resolve(true)));
    afterEach(() => command.runNpm.restore());

    it('should call InitCommand#install', function() {
      return expect(command.installLocal(stubModulePath), 'to be fulfilled')
        .then(() => {
          expect(command.runNpm.calledOnce, 'to be true');
          expect(command.runNpm.lastCall.args[0], 'to equal', ['install', '--save-dev', 'atscm']);
          expect(command.runNpm.lastCall.args[1], 'to equal', { cwd: stubModulePath });
        });
    });

    it('should install beta version with `useBetaVersion`', function() {
      return expect(command.installLocal(stubModulePath, { beta: true }), 'to be fulfilled')
        .then(() => {
          expect(command.runNpm.calledOnce, 'to be true');
          expect(command.runNpm.lastCall.args[0][2], 'to equal', 'atscm@beta');
        });
    });

    it('should run npm link with `link`', function() {
      return expect(command.installLocal(stubModulePath, { link: true }), 'to be fulfilled')
        .then(() => {
          expect(command.runNpm.calledTwice, 'to be true');
          expect(command.runNpm.lastCall.args[0], 'to equal', ['link', 'atscm']);
          expect(command.runNpm.lastCall.args[1], 'to equal', { cwd: stubModulePath });
        });
    });
  });

  /** @test {InitCommand#checkCliVersion} */
  describe('#checkCliVersion', function() {
    it('should throw error if version does not match', function() {
      expect(() => command.checkCliVersion({
        modulePackage: {
          engines: {
            'atscm-cli': '<0.1.0',
          },
        },
      }), 'to throw error', 'Invalid atscm-cli version: <0.1.0 required.');
    });
  });

  describe('#getDefaultOptions', function() {
    it('should return plain value defaults', function() {
      expect(command.getDefaultOptions([{ name: 'test', default: 13 }]),
        'to equal', { test: 13 });
    });

    it('should return plain value default choices', function() {
      expect(command.getDefaultOptions([{ name: 'test', choices: [13] }]),
        'to equal', { test: 13 });
    });

    it('should return object value default choices', function() {
      expect(command.getDefaultOptions([{ name: 'test', choices: [{ value: 13 }] }]),
        'to equal', { test: 13 });
    });

    it('should resolve choices with current value', function() {
      expect(command.getDefaultOptions([{ name: 'test', default: 13 }, {
        name: 'another',
        choices: (current) => [{ value: current.test * 2 }],
      }]),
      'to equal', { test: 13, another: 26 });
    });

    it('should skip options if specified', function() {
      expect(command.getDefaultOptions([{ name: 'test', default: 13 }, {
        name: 'another',
        when: (current) => current.test === 1,
      }]),
      'to equal', { test: 13 });
    });
  });

  /** @test {InitCommand#getOptions} */
  describe('#getOptions', function() {
    beforeEach(() => promptSpy.resetHistory());
    it('should run inquirer by default', function() {
      return expect(
        () => command.getOptions(stubModulePath),
        'to be fulfilled'
      )
        .then(() => {
          expect(promptSpy.calledOnce, 'to be true');
          expect(promptSpy.lastCall.args[0], 'to be', stubInitOptions);
        });
    });

    it('should use defaults with `useDefaults`', function() {
      return expect(
        command.getOptions(stubModulePath, { useDefaults: true }),
        'to equal',
        { test: 13 }
      )
        .then(() => {
          expect(promptSpy.calledOnce, 'to be false');
        });
    });
  });

  /** @test {InitCommand#writeFiles} */
  describe('#writeFiles', function() {
    it('should call local package init script', function() {
      const options = { test: 123 };

      return expect(command.writeFiles(stubModulePath, options),
        'to be fulfilled')
        .then(() => {
          expect(initStub.default.calledOnce, 'to be', true);
          expect(initStub.default.lastCall.args[0], 'to be', options);
        });
    });
  });

  /** @test {InitCommand#installDependencies} */
  describe('#installDependencies', function() {
    beforeEach(() => stub(command, 'install').callsFake(() => Promise.resolve(true)));
    afterEach(() => command.install.restore());

    it('should run install with given deps', function() {
      const deps = ['dep1', 'dep2'];

      return expect(command.installDependencies(stubModulePath, deps), 'to be fulfilled')
        .then(() => {
          expect(command.install.calledOnce, 'to be true');
          expect(command.install.lastCall.args[0], 'to equal', stubModulePath);
          expect(command.install.lastCall.args[1], 'to equal', deps);
        });
    });
  });

  /** @test {InitCommand#run} */
  describe('#run', function() {
    const deps = ['dep1', 'dep2'];
    const cli = {
      environment: {
        cwd: stubModulePath,
      },
      options: {
        force: false,
      },
      getEnvironment: spy(() => Promise.resolve({
        cwd: stubModulePath,
        modulePackage: atscmPkg,
      })),
    };

    beforeEach(() => {
      stub(command, 'checkDirectory').callsFake(() => Promise.resolve());
      stub(command, 'createEmptyPackage').callsFake(() => Promise.resolve());
      stub(command, 'installLocal').callsFake(() => Promise.resolve());
      stub(process, 'chdir');
      stub(command, 'getOptions').callsFake(() => Promise.resolve());
      stub(command, 'writeFiles').callsFake(() => Promise.resolve({ dependencies: deps }));
      stub(command, 'installDependencies').callsFake(() => Promise.resolve());
    });

    afterEach(() => {
      command.checkDirectory.restore();
      command.createEmptyPackage.restore();
      command.installLocal.restore();
      process.chdir.restore();
      command.getOptions.restore();
      command.writeFiles.restore();
      command.installDependencies.restore();
    });

    function expectCalled(method, count = 1) {
      return expect(command.run(cli), 'to be fulfilled')
        .then(() => expect(method.callCount, 'to equal', count));
    }

    it('should call AtSCMCli#getEnvironment twice', function() {
      return expectCalled(cli.getEnvironment, 2);
    });

    it('should not search in parent directories', function() {
      return expect(command.run(cli), 'to be fulfilled')
        .then(() => expect(cli.getEnvironment.alwaysCalledWith(false), 'to equal', true));
    });

    it('should call InitCommand#createEmptyPackage', function() {
      return expectCalled(command.createEmptyPackage);
    });

    it('should call InitCommand#installLocal', function() {
      return expectCalled(command.installLocal);
    });

    it('should call process.chdir', function() {
      return expectCalled(process.chdir);
    });

    it('should call InitCommand#getOptions', function() {
      return expectCalled(command.getOptions);
    });

    it('should call InitCommand#writeFiles', function() {
      return expectCalled(command.writeFiles);
    });

    it('should call InitCommand#installDependencies', function() {
      return expectCalled(command.installDependencies);
    });
  });

  /** @test {InitCommand#requiresEnvironment} */
  describe('#requiresEnvironment', function() {
    it('should return false', function() {
      expect(command.requiresEnvironment(), 'to equal', false);
    });
  });
});
