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
 * Returns the default export of a module, if present.
 * @param {any | { default: any }} mod The required module.
 * @return {any} The module's default export.
 */
function defaultExport(mod) {
  return mod.default || mod;
}

/**
 * Utility that returns any non-function values and calls them with the given args otherwise.
 * @param {function(...args: any[]): any | any} value The value to return or function to call.
 * @param {...any} [args] The arguments to apply if value is a function.
 * @return {any} The value or function call result.
 */
function allowFunction(value, ...args) {
  if (typeof value === 'function') {
    return value(...args);
  }

  return value;
}

/**
 * The command invoked when running "init".
 */
export default class InitCommand extends Command {
  /**
   * Creates a new {@link InitCommand} with the specified name and description.
   * @param {string} name The command's name.
   * @param {string} description The command's description.
   */
  constructor(name, description) {
    super(name, description, {
      options: {
        yes: CliOptions.yes,
        force: CliOptions.force,
        beta: CliOptions.beta,
        link: CliOptions.link,
      },
    });
  }

  /**
   * Checks if the given path contains an empty directory. OS specific temporary files (*.DS_Store*
   * under macOS, *thumbs* under Windows) are ignored.
   * @param {string} path The path to check.
   * @param {boolean} [overwrite=false] If existing files should be overwritten.
   * @return {Promise<string, Error>} Fulfilled with the valid directory's path, rejected if `path`
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
   * Creates a an empty *package* file at the given path.
   * @param {string} path The location to create the package at.
   * @return {Promise<undefined, Error>} Rejected if an error occurred while writing the file.
   */
  createEmptyPackage(path) {
    return new Promise((resolve, reject) => {
      writeFile(join(path, 'package.json'), '{}', err => {
        if (err) {
          // FIXME: Call with SystemError class
          reject(
            Object.assign(err, {
              message: `Unable to create package.json at ${path}`,
              originalMessage: err.message,
            })
          );
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Runs npm with the given args.
   * @param {string[]} args The arguments to call npm with.
   * @param {Object} options Options applied to the spawn call.
   */
  runNpm(args, options = {}) {
    return new Promise((resolve, reject) => {
      which('npm', (err, npm) => {
        if (err) {
          return reject(err);
        }

        const child = spawn(
          npm,
          args,
          Object.assign({}, options, {
            /* stdio: 'inherit' */
          })
        )
          .on('error', npmErr => reject(npmErr))
          .on('close', code => {
            if (code > 0) {
              reject(new Error(`npm ${args[0]} returned code ${code}`));
            } else {
              resolve();
            }
          });

        Logger.pipeLastLine(child.stderr);
        Logger.pipeLastLine(child.stdout);

        return child;
      });
    });
  }

  /**
   * Runs `npm install --save-dev {packages}` at the given path.
   * @param {string} path The path to install packages at.
   * @param {string|string[]} packages Names of the packages to install.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  install(path, packages) {
    return this.runNpm(['install', '--save-dev'].concat(packages), { cwd: path });
  }

  /**
   * Installs the local atscm module at the given path.
   * @param {string} path The path to install the module at.
   * @param {Object} options The options to use.
   * @param {boolean} [options.useBetaRelease=false] If beta versions should be used.
   * @param {boolean} [options.link=false] Link instead of installing.
   * @return {Promise<undefined, Error>} Rejected if installing failed, resolved otherwise.
   */
  async installLocal(path, { beta: useBetaRelease = false, link = false } = {}) {
    Logger.info('Installing latest version of atscm...');

    if (useBetaRelease) {
      Logger.debug(Logger.colors.gray('Using beta release'));
    }

    await this.install(path, useBetaRelease ? 'atscm@beta' : 'atscm');

    if (link) {
      Logger.info('Linking atscm...');
      await this.runNpm(['link', 'atscm'], { cwd: path });
    }
  }

  /**
   * Checks the version of this package against the "engines > atscm-cli" field of the newly
   * installed atscm module's package file.
   * @param {Liftoff.Environment} env The environment to check.
   * @return {Liftoff.Environment} The environment to check.
   * @throws {Error} Throws an error if the atscm-cli version does not match.
   */
  checkCliVersion(env) {
    Logger.debug('Checking atscm-cli version...');

    const required = env.modulePackage.engines['atscm-cli'];
    if (!validVersion(pkg.version.split('-beta')[0], required)) {
      Logger.info('Your version of atscm-cli is not compatible with the latest version atscm.');
      Logger.info('Please run', Logger.format.command('npm install -g atscm-cli'), 'to update.');

      throw new Error(`Invalid atscm-cli version: ${required} required.`);
    }

    return env;
  }

  /**
   * Returns the default values for the given init options.
   * @param {Object[]} options An array of init options to check.
   */
  getDefaultOptions(options) {
    return options.reduce((current, option) => {
      if (option.when && !allowFunction(option.when, current)) {
        return current;
      }

      let value;
      if (option.default !== undefined) {
        value = option.default;
      } else if (option.choices) {
        const [firstChoice] = allowFunction(option.choices, current);
        value = firstChoice.value || firstChoice;
      }

      return Object.assign(current, {
        [option.name]: value,
      });
    }, {});
  }

  /**
   * Resolves the needed options from the local atscm module and asks for them. These options are
   * stored in the `atscm` module inside `out/init/options`.
   * @param {string} modulePath The path to the local module to use.
   * @param {Object} [options] The options to use.
   * @param {boolean} [options.useDefaults=false] Use default values.
   * @return {Promise<Object, Error>} Resolved with the chosen options.
   */
  getOptions(modulePath, { useDefaults = false } = {}) {
    // eslint-disable-next-line global-require
    const options = defaultExport(require(join(modulePath, '../init/options')));

    if (useDefaults) {
      return this.getDefaultOptions(options);
    }

    Logger.info('Answer these questions to create a new project:');
    return prompt(options);
  }

  /**
   * Runs the local atscm module's init script. This script is stored in the `atscm` module inside
   * `out/init/init`.
   * @param {string} modulePath The path to the local module to use.
   * @param {Object} options The options to apply (Received by calling
   * {@link InitCommand#getOptions}).
   * @return {Promise<{install: string[]}, Error>} Resolved with information on the further init
   * steps (which dependencies are needed), rejected with an error if running the init script
   * failed.
   */
  writeFiles(modulePath, options) {
    // eslint-disable-next-line global-require
    return defaultExport(require(join(modulePath, '../init/init')))(options);
  }

  /**
   * Installs any additional dependencies needed after writing files.
   * @param {string} path The path to install the dependencies at.
   * @param {string[]} deps Names of the packages to install.
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
    return cli
      .getEnvironment(false)
      .then(env => this.checkDirectory(env.cwd, cli.options.force))
      .then(() => this.createEmptyPackage(cli.environment.cwd))
      .then(() => this.installLocal(cli.environment.cwd, cli.options))
      .then(() => cli.getEnvironment(false))
      .then(env => this.checkCliVersion(env))
      .then(env => process.chdir(env.cwd))
      .then(() => this.getOptions(cli.environment.modulePath, { useDefaults: cli.options.yes }))
      .then(options =>
        this.writeFiles(cli.environment.modulePath, Object.assign({}, cli.environment, options))
      )
      .then(result => this.installDependencies(cli.environment.cwd, result.install))
      .then(async () => {
        if (cli.options.link) {
          Logger.info('Linking atscm...');
          await this.runNpm(['link', 'atscm'], { cwd: cli.environment.cwd });
        }
      })
      .then(() => {
        Logger.info('Created new project at', Logger.format.path(cli.environment.cwd));
      });
  }

  /**
   * This command never requires an {@link Liftoff.Environment}.
   * @return {boolean} Always `false`.
   */
  requiresEnvironment() {
    return false;
  }
}
