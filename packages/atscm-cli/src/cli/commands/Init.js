import { readdir, writeFile } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import which from 'which';
import { prompt } from 'inquirer';
import { satisfies as validVersion } from 'semver';
import Command from '../../lib/cli/Command';
import Logger from '../../lib/util/Logger';
import pkg from '../../../package.json';
import CliOptions from '../Options';

const IgnoredFiles = ['.ds_store', 'thumbs.db'];

/**
 * The command invoked when running "init".
 */
export default class InitCommand extends Command {

  /**
   * Creates a new {@link InitCommand} with the specified name and description.
   * @param {String} name The command's name.
   * @param {String} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        force: CliOptions.force,
      },
    });
  }

  /**
   * Checks if the given path contains an empty directory. OS specific temporary files (.DS_Store
   * under macOS, thumbs.db under Windows) are ignored.
   * @param {String} path The path to check.
   * @param {Boolean} [overwrite=false] If existing files should be overwritten.
   * @return {Promise<String, Error>} Fulfilled with the valid directory's path, rejected if `path`
   * contains no or a non-empty directory.
   */
  checkDirectory(path, overwrite = false) {
    return new Promise((resolve, reject) => {
      readdir(path, (err, files) => {
        if (err) {
          if (err.code === 'ENOENT') {
            reject(new Error(`${Logger.format.path(path)} does not exist`));
          } else if (err.code === 'ENOTDIR') {
            reject(new Error(`${Logger.format.path(path)} is not a directory`));
          } else {
            reject(err);
          }
        } else if (files.filter(f => !IgnoredFiles.includes(f.toLowerCase())).length > 0) {
          const message = `${Logger.format.path(path)} is not empty`;

          if (overwrite) {
            Logger.warn(message);
            Logger.warn(Logger.colors.yellow('Using --force, continue...'));
            resolve(path);
          } else {
            reject(new Error(message));
          }
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
      writeFile(join(path, 'package.json'), '{}', err => {
        if (err) {
          // FIXME: Call with SystemError class
          reject(Object.assign(err, {
            message: `Unable to create package.json at ${path}`,
            originalMessage: err.message,
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
      which('npm', (err, npm) => {
        if (err) {
          reject(err);
        } else {
          const child = spawn(npm, ['install', '--save-dev'].concat(packages), { cwd: path })
            .on('error', npmErr => reject(npmErr))
            .on('close', code => {
              if (code > 0) {
                reject(new Error(`npm install returned code ${code}`));
              } else {
                resolve();
              }
            });

          Logger.pipeLastLine(child.stdout);
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
    Logger.info('Installing latest version of atscm...');

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
    Logger.debug('Checking atscm-cli version...');

    const required = env.modulePackage.engines['atscm-cli'];
    if (!validVersion(pkg.version, required)) {
      Logger.info('Your version of atscm-cli is not compatible with the latest version atscm.');
      Logger.info('Please run', Logger.format.command('npm install -g atscm-cli'), 'to update.');

      throw new Error(`Invalid atscm-cli version: ${required} required.`);
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
    Logger.info('Answer these questions to create a new project:');

    // eslint-disable-next-line global-require
    const options = require(join(modulePath, '../init/options')).default;

    return prompt(options);
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
    return require(join(modulePath, '../init/init')).default(options);
  }

  /**
   * Installs any additional dependencies needed after writing files.
   * @param {String} path The path to install the dependencies at.
   * @param {String[]} deps Names of the packages to install.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  installDependencies(path, deps) {
    Logger.info('Installing dependencies...');

    return this.install(path, deps);
  }

  /**
   * Creates a new atscm project.
   * @param {AtSCMCli} cli The current Cli instance.
   */
  run(cli) {
    return cli.getEnvironment(false)
      .then(env => this.checkDirectory(env.cwd, cli.options.force))
      .then(() => this.createEmptyPackage(cli.environment.cwd))
      .then(() => this.installLocal(cli.environment.cwd))
      .then(() => cli.getEnvironment(false))
      .then(env => this.checkCliVersion(env))
      .then(env => process.chdir(env.cwd))
      .then(() => this.getOptions(cli.environment.modulePath))
      .then(options => this.writeFiles(
        cli.environment.modulePath,
        Object.assign({}, cli.environment, options)
      ))
      .then(result => this.installDependencies(cli.environment.cwd, result.install))
      .then(() => {
        Logger.info('Created new project at', Logger.format.path(cli.environment.cwd));
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
