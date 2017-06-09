import { get } from 'axios';
import { gt } from 'semver';
import Logger from '../../lib/util/Logger';
import Command from '../../lib/cli/Command';
import ExternalCommand from '../../lib/util/ExternalCommand';

/**
 * The command invoked by running "update".
 */
export default class UpdateCommand extends Command {

  /**
   * Checks atscm's dist-tags in the npm registry and resolves with the latest version available.
   * @return {Promise<string>} Fulfilled with the latest atscm version available.
   */
  getLatestVersion() {
    return get('https://registry.npmjs.org/-/package/atscm/dist-tags')
      .then(res => res.data.latest);
  }

  /**
   * Checks if an update is required with the given latest and current version.
   * @param {string} latestVersion The latest version available.
   * @param {string} currentVersion The current version to check against.
   * @return {boolean|string} Returns `false` if no update is required or the version to install if
   * an update is required.
   */
  updateNeeded(latestVersion, currentVersion) {
    Logger.debug('Latest version:    ', Logger.format.value(latestVersion));
    Logger.debug('Current version:   ', Logger.format.value(currentVersion));

    return gt(latestVersion, currentVersion) && latestVersion;
  }

  /**
   * Runs `npm install --save-dev atscm@latest` in a separate process.
   * @param {AtSCMCli} cli The cli instance used.
   * @return {Promise<string, Error>} Fulfilled with npm's stdout or rejected with a spawn error or
   * error code.
   */
  update(cli) {
    return ExternalCommand.run('npm', ['install', '--save-dev', 'atscm@latest'], {
      spawn: {
        cwd: cli.environment.cwd,
      },
    });
  }

  /**
   * Updates atscm if a newer version is available.
   * @param {AtSCMCli} cli The cli instance used.
   * @return {Promise<*>} Resolved if the command completed suceessfully, rejected with the error
   * that occurred otherwise.
   */
  run(cli) {
    return Promise.all([
      this.getLatestVersion(),
      Promise.resolve(cli.environment.modulePackage.version),
    ])
      .then(versions => this.updateNeeded(...versions))
      .then(needed => {
        if (needed) {
          Logger.info('Updating to version', Logger.format.value(needed));

          return this.update(cli)
            .then(() => Logger.info('Done.'));
        }

        return Logger.info('Already up-to-date.');
      });
  }

  /**
   * This command always needs to be run inside an existant atscm project.
   * @return {boolean} Always `true`.
   */
  requiresEnvironment() {
    return true;
  }

}
