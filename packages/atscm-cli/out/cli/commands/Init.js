'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _path = require('path');

var _child_process = require('child_process');

var _which = require('which');

var _which2 = _interopRequireDefault(_which);

var _inquirer = require('inquirer');

var _semver = require('semver');

var _Command = require('../../lib/cli/Command');

var _Command2 = _interopRequireDefault(_Command);

var _Logger = require('../../lib/util/Logger');

var _Logger2 = _interopRequireDefault(_Logger);

var _package = require('../../../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const IgnoredFiles = ['.ds_store', 'thumbs.db'];

/**
 * The command invoked when running "init".
 */
class InitCommand extends _Command2.default {

  /**
   * Checks if the given path contains an empty directory. OS specific temporary files (.DS_Store
   * under macOS, thumbs.db under Windows) are ignored.
   * @param {String} path The path to check.
   * @return {Promise<String, Error>} Fulfilled with the valid directory's path, rejected if `path`
   * contains no or a non-empty directory.
   */
  checkDirectory(path) {
    return new Promise((resolve, reject) => {
      (0, _fs.readdir)(path, (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') {
            reject(new Error(`${ _Logger2.default.format.path(path) } does not exist`));
          } else if (err.code === 'ENOTDIR') {
            reject(new Error(`${ _Logger2.default.format.path(path) } is not a directory`));
          } else {
            reject(err);
          }
        } else if (files.filter(f => !IgnoredFiles.includes(f.toLowerCase())).length > 0) {
          reject(new Error(`${ _Logger2.default.format.path(path) } is not empty`));
        } else {
          resolve(path);
        }
      });
    });
  }

  /**
   * Creates a an empty *package.json* file at the given path.
   * @param {String} path The location to create the package at.
   * @return {Promise<undefined, Error>} Rejected if an error occurred while writing the file.
   */
  createEmptyPackage(path) {
    return new Promise((resolve, reject) => {
      (0, _fs.writeFile)((0, _path.join)(path, 'package.json'), '{}', err => {
        if (err) {
          // FIXME: Call with SystemError class
          reject(Object.assign(err, {
            message: `Unable to create package.json at ${ path }`,
            originalMessage: err.message
          }));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Runs `npm install --save-dev {packages}` at the given path.
   * @param {String} path The path to install packages at.
   * @param {String|String[]} packages Names of the packages to install.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  install(path, packages) {
    return new Promise((resolve, reject) => {
      (0, _which2.default)('npm', (err, npm) => {
        if (err) {
          reject(err);
        } else {
          const child = (0, _child_process.spawn)(npm, ['install', '--save-dev'].concat(packages), { cwd: path }).on('error', npmErr => reject(npmErr)).on('close', code => {
            if (code > 0) {
              reject(new Error(`npm install returned code ${ code }`));
            } else {
              resolve();
            }
          });

          _Logger2.default.pipeLastLine(child.stdout);
        }
      });
    });
  }

  /**
   * Installs the local atscm module at the given path.
   * @param {String} path The path to install the module at.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  installLocal(path) {
    _Logger2.default.info('Installing latest version of atscm...');

    // FIXME: call with (path, 'atscm') once atscm is published
    return this.install(path, 'atscm');
  }

  /**
   * Checks the version of this package against the "engines.atscm-cli" field of the newly installed
   * atscm module's package.json.
   * @param {Liftoff.Environment} env The environment to check.
   * @return {Liftoff.Environment} The environment to check.
   * @throws {Error} Throws an error if the atscm-cli version does not match.
   */
  checkCliVersion(env) {
    _Logger2.default.debug('Checking atscm-cli version...');

    const required = env.modulePackage.engines['atscm-cli'];
    if (!(0, _semver.satisfies)(_package2.default.version, required)) {
      _Logger2.default.info('Your version of atscm-cli is not compatible with the latest version atscm.');
      _Logger2.default.info('Please run', _Logger2.default.format.command('npm install -g atscm-cli'), 'to update.');

      throw new Error(`Invalid atscm-cli version: ${ required } required.`);
    }

    return env;
  }

  /**
   * Resolves the needed options from the local atscm module and asks for them. These options are
   * stored in the `atscm` module inside `out/init/options.js`.
   * @param {String} modulePath The path to the local module to use.
   * @return {Promise<Object, Error>} Resolved with the chosen options.
   */
  getOptions(modulePath) {
    _Logger2.default.info('Answer these questions to create a new project:');

    // eslint-disable-next-line global-require
    const options = require((0, _path.join)(modulePath, '../init/options')).default;

    return (0, _inquirer.prompt)(options);
  }

  /**
   * Runs the local atscm module's init script. This script is stored in the `atscm` module inside
   * `out/init/init.js`.
   * @param {String} modulePath The path to the local module to use.
   * @param {Object} options The options to apply (Received by calling
   * {@link InitCommand#getOptions}).
   * @return {Promise<{install: String[]}, Error>} Resolved with information on the further init
   * steps (e.g. which dependencies are needed), rejected with an error if running the init script
   * failed.
   */
  writeFiles(modulePath, options) {
    // eslint-disable-next-line global-require
    return require((0, _path.join)(modulePath, '../init/init')).default(options);
  }

  /**
   * Installs any additional dependencies needed after writing files.
   * @param {String} path The path to install the dependencies at.
   * @param {String[]} deps Names of the packages to install.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  installDependencies(path, deps) {
    _Logger2.default.info('Installing dependencies...');

    return this.install(path, deps);
  }

  /**
   * Creates a new atscm project.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    return cli.getEnvironment().then(env => this.checkDirectory(env.cwd)).then(() => this.createEmptyPackage(cli.environment.cwd)).then(() => this.installLocal(cli.environment.cwd)).then(() => cli.getEnvironment()).then(env => this.checkCliVersion(env)).then(env => process.chdir(env.cwd)).then(() => this.getOptions(cli.environment.modulePath)).then(options => this.writeFiles(cli.environment.modulePath, Object.assign({}, cli.environment, options))).then(result => this.installDependencies(cli.environment.cwd, result.install)).then(() => {
      _Logger2.default.info('Created new project at', _Logger2.default.format.path(cli.environment.cwd));
    });
  }

  /**
   * This command never requires an {@link Liftoff.Environment}.
   * @return {Boolean} Always `false`.
   */
  requiresEnvironment() {
    return false;
  }

}
exports.default = InitCommand;